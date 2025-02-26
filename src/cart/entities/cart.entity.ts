import { z } from 'zod';
import { CreateCartSchema } from '../dto/create-cart.dto';

export type Cart = z.infer<typeof CreateCartSchema> & {
  id: number;
};
