import { z } from 'zod';

const XenditPaymentDetailSchema = z.object({
  receipt_id: z.string(),
  source: z.string(),
  amount: z.number().optional(),
});

const XenditPaymentDataSchema = z.object({
  id: z.string(),
  business_id: z.string(),
  currency: z.string(),
  amount: z.number(),
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED']),
  created: z.string().datetime(),
  qr_id: z.string(),
  qr_string: z.string(),
  reference_id: z.string(),
  type: z.enum(['DYNAMIC', 'STATIC']),
  channel_code: z.string(),
  expires_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
  token: z.string().optional(),
  payment_detail: XenditPaymentDetailSchema,
});

export const XenditWebhookSchema = z.object({
  event: z.string(),
  created: z.string().datetime(),
  business_id: z.string(),
  data: XenditPaymentDataSchema,
});

export type XenditWebhookSchema = z.infer<typeof XenditWebhookSchema>;
