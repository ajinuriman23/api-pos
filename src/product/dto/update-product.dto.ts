import { ProductStatus } from './create-product.dto';
import { ProductSchema } from './create-product.dto';
import { z } from 'zod';

// Schema untuk update produk (semua field opsional kecuali id)
export const UpdateProductSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
})
  .partial()
  .extend({ id: z.number().int().positive() });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// Schema untuk query filter produk
export const ProductFilterSchema = z.object({
  name: z.string().optional(),
  category_id: z.number().int().positive().optional(),
  outlet_id: z.number().int().positive().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  sort_by: z.enum(['name', 'price', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

export type ProductFilterDto = z.infer<typeof ProductFilterSchema>;
