import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import RequestWithUser from 'src/interfaces/request.interface';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { XenditService } from 'src/xendit/xendit.service';
import { CartWithProducts } from './entities/cart-product.entity';
import {
  CreateTransactionDto,
  PaymentMethod,
} from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    private supabaseService: SupabaseService,
    private xenditService: XenditService
  ) {}

  async create(req: RequestWithUser, transactionDto: CreateTransactionDto) {
    try {
      const supabaseClient = this.supabaseService.getClient();

      if (!req.user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      // cek status outlet
      if (req.outlet) {
        const outletStatus = Array.isArray(req.outlet)
          ? req.outlet[0]?.status
          : req.outlet.status;

        if (outletStatus === 'inactive') {
          throw new BadRequestException('Outlet sedang tutup');
        }
      }

      // Ambil data carts
      const {
        data: carts,
        error: cartsError,
      }: PostgrestSingleResponse<CartWithProducts[]> = await supabaseClient
        .from('carts')
        .select('*, products:product_id (*)')
        .eq('staff_id', req.user.id);

      if (cartsError) throw new Error(cartsError.message);
      if (!carts || carts.length === 0) {
        throw new NotFoundException('Keranjang belanja kosong');
      }

      // Hitung total amount
      const totalAmount = carts.reduce(
        (sum, cart) => sum + cart.products.price * cart.quantity,
        0
      );

      // Validasi pembayaran untuk non-QRIS
      if (
        transactionDto.payment_method !== PaymentMethod.QRIS &&
        transactionDto.amount_paid < totalAmount
      ) {
        throw new BadRequestException('Jumlah pembayaran kurang dari total');
      }

      const change = transactionDto.amount_paid - totalAmount;
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Proses QRIS
      let qrPayment: any;
      let qrisProvider: string | null = null;

      if (transactionDto.payment_method === PaymentMethod.QRIS) {
        const formattedCarts = carts.map((cart) => ({
          name: cart.products.name,
          quantity: cart.quantity,
          price: cart.products.price,
          category: cart.products.category,
        }));

        qrPayment = await this.xenditService.createQrCode(
          totalAmount,
          invoiceNumber,
          formattedCarts
        );
        qrisProvider = 'QRIS';
      }

      // Format data keranjang untuk database
      const formattedCarts = carts.map((cart) => ({
        product_id: cart.product_id,
        product_name: cart.products.name,
        product_price: cart.products.price,
        quantity: cart.quantity,
        product_picture: cart.products.picture,
        subtotal: cart.products.price * cart.quantity,
      }));

      // Eksekusi fungsi PostgreSQL
      const { data: transactionId, error: dbError } = await supabaseClient.rpc(
        'create_transaction_with_payment',
        {
          invoice_number: invoiceNumber,
          staff_id: req.user.id,
          name_customer: transactionDto.name_consumer,
          total_amount: totalAmount,
          amount_paid: transactionDto.amount_paid,
          change: change,
          payment_method: transactionDto.payment_method,
          transaction_date: new Date().toISOString(),
          carts: formattedCarts, // Otomatis dikonversi ke JSONB oleh Supabase
          url_payment: '',
          provider: qrisProvider,
        }
      );

      if (dbError) {
        throw new InternalServerErrorException(
          `Database error: ${dbError.message}`
        );
      }

      return {
        transaction_id: transactionId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        status:
          transactionDto.payment_method === PaymentMethod.CASH
            ? 'completed'
            : 'pending',
        qr_payment: qrPayment,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async simulatePaymentQrCode(id: string) {
    return this.xenditService.simulatePaymentQrCode(id);
  }

  findAll() {
    return `This action returns all transaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    console.log(updateTransactionDto);
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
