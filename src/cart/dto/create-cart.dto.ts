// src/cart/dto/create-cart.dto.ts
import { z } from 'zod';

export const CreateCartSchema = z.object({
  product_id: z.number().int().positive(),
  staff_id: z.number().int().positive(),
  outlet_id: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
});

export type CreateCartDto = z.infer<typeof CreateCartSchema>;
