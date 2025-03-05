import { z } from 'zod';

// Enum untuk payment_method
export enum PaymentMethod {
  CASH = 'cash',
  QRIS = 'qris',
}

// Enum untuk transaction_status
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Zod schema untuk validasi detail_transaction
export const DetailTransactionSchema = z.object({
  id: z.number().int().positive().optional(),
  transaction_id: z.number().int().positive('ID transaksi harus positif'),
  product_id: z.number().int().positive('ID produk harus positif'),
  product_name: z.string().min(1, 'Nama produk tidak boleh kosong'),
  product_price: z
    .number()
    .int()
    .nonnegative('Harga produk tidak boleh negatif'),
  product_picture: z.string().min(1, 'URL gambar produk tidak boleh kosong'),
  quantity: z.number().int().positive('Jumlah produk harus positif'),
  subtotal: z.number().int().nonnegative('Subtotal tidak boleh negatif'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Zod schema untuk validasi transactions
export const TransactionSchema = z.object({
  id: z.number().int().positive().optional(),
  invoice_number: z.string().min(1, 'Nomor invoice tidak boleh kosong'),
  staff_id: z.number().int().positive('ID staff harus positif'),
  name_consumer: z.string().min(1, 'Nama konsumen tidak boleh kosong'),
  total_amount: z
    .number()
    .int()
    .nonnegative('Total amount tidak boleh negatif'),
  amount_paid: z
    .number()
    .int()
    .nonnegative('Jumlah yang dibayar tidak boleh negatif'),
  change: z.number().int().nonnegative('Kembalian tidak boleh negatif'),
  payment_method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
  }),
  provider: z.string().min(1, 'Provider tidak boleh kosong').optional(),
  status: z.nativeEnum(TransactionStatus, {
    errorMap: () => ({ message: 'Status transaksi tidak valid' }),
  }),
  notes: z.string().optional(),
  transaction_date: z
    .string()
    .datetime('Tanggal transaksi harus dalam format ISO 8601'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  details: z
    .array(DetailTransactionSchema)
    .min(1, 'Minimal 1 detail transaksi'),
});

// Schema untuk membuat transaksi baru (ID opsional, timestamps tidak diisi)
export const CreateTransactionSchema = z.object({
  name_consumer: z.string().min(1, 'Nama konsumen tidak boleh kosong'),
  amount_paid: z
    .number()
    .int()
    .nonnegative('Jumlah yang dibayar tidak boleh negatif'),
  payment_method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
  }),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;

// Schema untuk membuat detail transaksi baru (ID opsional, timestamps tidak diisi)
export const CreateDetailTransactionSchema = DetailTransactionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateDetailTransactionDto = z.infer<
  typeof CreateDetailTransactionSchema
>;
