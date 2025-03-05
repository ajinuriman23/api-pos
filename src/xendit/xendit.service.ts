import {
  HttpStatus,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { XenditCartItem } from 'src/transaction/entities/cart-product.entity';
import { Xendit } from 'xendit-node';
import { XenditWebhookSchema } from './dto/webhook.dto';
import { PaymentRequestParameters } from 'xendit-node/payment_request/models';
import { SupabaseService } from 'src/supabase/supabase.service';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import { WinstonLoggerConfig } from 'src/common/config/logger.config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse, isAxiosError } from 'axios';
import { XenditCreateQrCodeResponse } from './entities/webhook.entity';
import { Logger } from 'winston';
import { createLogger } from 'winston';

@Injectable()
export class XenditService {
  private xendit: Xendit;
  private readonly logger: Logger;
  private readonly baseUrl = 'https://api.xendit.co/';
  private readonly secretKey = process.env.XENDIT_SECRET_KEY;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly httpService: HttpService
  ) {
    this.xendit = this.getXenditClient();
    this.logger = createLogger(WinstonLoggerConfig);
  }

  private getXenditClient() {
    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('XENDIT_SECRET_KEY is not set');
    }
    return new Xendit({ secretKey });
  }

  async createTransactionQrCode(
    amount: number,
    referenceId: string,
    items: XenditCartItem[]
  ) {
    const data: PaymentRequestParameters = {
      referenceId: referenceId,
      currency: 'IDR',
      amount: amount,
      paymentMethod: {
        type: 'QR_CODE',
        reusability: 'ONE_TIME_USE',
        qrCode: {
          channelCode: 'QRIS',
        },
      },
      items: items.map((item) => ({
        referenceId: referenceId,
        name: item.name,
        category: 'product',
        currency: 'IDR',
        quantity: item.quantity,
        price: item.price,
        type: 'PRODUCT',
      })),
    };

    const charge = await this.xendit.PaymentRequest.createPaymentRequest({
      data,
    });

    return charge;
  }

  // create qr-code
  async createQrCode(
    amount: number,
    referenceId: string,
    items: XenditCartItem[]
  ) {
    if (!this.secretKey) {
      throw new InternalServerErrorException('XENDIT_SECRET_KEY is not set');
    }

    const data = {
      reference_id: referenceId,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount: amount,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expired dalam 24 jam
      payment_method: {
        type: 'QR_CODE',
        reusability: 'ONE_TIME_USE',
        qr_code: {
          channel_code: 'QRIS',
        },
      },
      items: items.map((item) => ({
        reference_id: referenceId,
        name: item.name,
        category: 'product',
        currency: 'IDR',
        quantity: item.quantity,
        price: item.price,
        type: 'PRODUCT',
      })),
    };

    const { data: responseData }: AxiosResponse<XenditCreateQrCodeResponse> =
      await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/qr_codes`, data, {
          headers: {
            'api-version': '2022-07-31',
            'Content-Type': 'application/json',
          },
          auth: {
            username: this.secretKey,
            password: '',
          },
        })
      );

    return responseData;
  }

  async simulatePayment(qrCodeId: string, amount?: number) {
    if (!this.secretKey) {
      throw new InternalServerErrorException('XENDIT_SECRET_KEY is not set');
    }

    const { data }: AxiosResponse<XenditCreateQrCodeResponse> =
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/qr_codes/${qrCodeId}/payments/simulate`,
          amount ? { amount } : {},
          {
            headers: {
              'api-version': '2022-07-31',
              'Content-Type': 'application/json',
            },
            auth: {
              username: this.secretKey,
              password: '',
            },
          }
        )
      );
    return data;
  }

  async callbackXendit(payload: XenditWebhookSchema) {
    // Validasi callback token dari header request akan dilakukan di controller

    // Verifikasi payload callback
    if (!payload || !payload.data || !payload.data.id || !payload.data.status) {
      throw new InternalServerErrorException('Payload callback tidak valid');
    }

    // Ambil data pembayaran
    const {
      data: { reference_id: referenceId, status },
    } = payload;

    // Cari transaksi berdasarkan QR ID
    const supabaseClient = this.supabaseService.getClient();
    const {
      data: transactions,
      error: fetchError,
    }: PostgrestSingleResponse<Transaction> = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('invoice_number', referenceId)
      .eq('status', 'pending')
      .single();

    if (!transactions) {
      throw new InternalServerErrorException('Transaksi tidak ditemukan');
    }

    if (fetchError) {
      throw new InternalServerErrorException(
        `Gagal mengambil data transaksi ${JSON.stringify(fetchError)}`
      );
    }

    // Update status transaksi berdasarkan status pembayaran
    const updateData = {
      updated_at: new Date().toISOString(),
      ...(status === 'SUCCEEDED'
        ? {
            status: 'completed',
            amount_paid: payload.data.payment_detail.amount,
            notes: `Dibayar via QRIS pada ${new Date().toLocaleString()}. Payment ID: ${payload.data.payment_detail.receipt_id}`,
          }
        : {
            status: 'failed',
            notes: `Pembayaran QRIS ${status.toLowerCase()} pada ${new Date(
              transactions.created_at ?? new Date()
            ).toLocaleString()}`,
          }),
    };

    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update(updateData)
      .eq('id', transactions.id);

    if (updateError) {
      throw new InternalServerErrorException(
        `Gagal mengupdate transaksi: ${updateError.message}`
      );
    }

    return {
      status: 'SUCCESS',
      message: 'Callback berhasil diproses',
    };
  }

  async getPaymentRequest(id: string) {
    const res = await this.xendit.PaymentRequest.getPaymentRequestByID({
      paymentRequestId: id,
    });

    return res;
  }

  // get qr code
  async getQrCode(id: string) {
    try {
      if (!this.secretKey) {
        throw new InternalServerErrorException('XENDIT_SECRET_KEY is not set');
      }

      const response = await firstValueFrom(
        this.httpService.get<XenditWebhookSchema>(
          `${this.baseUrl}/qr_codes/${id}`,
          {
            headers: {
              'api-version': '2022-07-31',
              'Content-Type': 'application/json',
            },
            auth: {
              username: this.secretKey,
              password: '',
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      // Tangkap error dari Axios dan lempar error spesifik
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;

        throw new HttpException(
          {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message:
              axiosError.response?.data?.['message'] || 'Xendit API Error',
            error: axiosError.response?.data,
          },
          axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new InternalServerErrorException('Gagal mendapatkan QR code');
    }
  }

  // simulate payment qr code
  async simulatePaymentQrCode(id: string) {
    if (!this.secretKey) {
      throw new InternalServerErrorException('XENDIT_SECRET_KEY is not set');
    }

    // check payment in xendit

    const qrCode = await this.getQrCode(id);

    if (!qrCode) {
      throw new InternalServerErrorException('QR code tidak ditemukan');
    }

    if (qrCode.data.status !== 'SUCCEEDED') {
      throw new InternalServerErrorException('QR code tidak aktif');
    }

    // exampleId: "pr-1fdaf346-dd2e-4b6c-b938-124c7167a822"
    const res = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/qr_codes/${id}/payments/simulate`,
        {},
        {
          headers: {
            'api-version': '2022-07-31',
            'Content-Type': 'application/json',
          },
          auth: {
            username: this.secretKey,
            password: '',
          },
        }
      )
    );

    return res;
  }
}
