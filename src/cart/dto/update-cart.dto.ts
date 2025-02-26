// src/cart/dto/update-cart.dto.ts
import { z } from 'zod';
import { CreateCartSchema } from './create-cart.dto';

export const UpdateCartSchema = CreateCartSchema.partial();

export type UpdateCartDto = z.infer<typeof UpdateCartSchema>;
