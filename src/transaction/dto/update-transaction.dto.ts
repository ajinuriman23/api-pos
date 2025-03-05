import { z } from 'zod';
import { TransactionStatus } from './create-transaction.dto';

export const UpdateTransactionSchema = z.object({
  payment_status: z.nativeEnum(TransactionStatus, {
    errorMap: () => ({ message: 'Status pembayaran tidak valid' }),
  }),
});

export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
