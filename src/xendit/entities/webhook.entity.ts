import { z } from 'zod';
import { XenditWebhookSchema } from '../dto/webhook.dto';
import { CartWithProducts } from 'src/transaction/entities/cart-product.entity';

export type XenditWebhook = z.infer<typeof XenditWebhookSchema>;

export type XenditCreateQrCodeResponse = {
  id: string;
  reference_id: string;
  business_id: string;
  type: 'DYNAMIC' | 'STATIC';
  currency: string;
  amount: number;
  channel_code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  qr_string: string;
  expires_at: string;
  created: string;
  updated: string;
  basket: CartWithProducts | null;
  metadata: CartWithProducts | null;
};
