import { ProductSchema } from '../dto/create-product.dto';
import { z } from 'zod';

export type Product = z.infer<typeof ProductSchema> & {
  id: number;
  name: string;
  picture: string;
  reference_id: string;
  category: string;
};
