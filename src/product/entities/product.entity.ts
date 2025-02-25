import { ProductSchema } from '../dto/create-product.dto';
import { z } from 'zod';

export type Product = z.infer<typeof ProductSchema> & {
  picture: string;
};
