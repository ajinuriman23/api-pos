import { z } from 'zod';
import {
  TransactionSchema,
  DetailTransactionSchema,
} from '../dto/create-transaction.dto';

export type Transaction = z.infer<typeof TransactionSchema>;

export type DetailTransaction = z.infer<typeof DetailTransactionSchema>;
