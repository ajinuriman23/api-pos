import { z } from 'zod';

// Enum untuk product_status
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

// Zod schema untuk validasi produk
export const ProductSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z
    .string()
    .min(2, 'Nama produk harus minimal 2 karakter')
    .max(100, 'Nama produk maksimal 100 karakter'),
  price: z.number().int().nonnegative('Harga tidak boleh negatif'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  category_id: z.number().int().positive('ID kategori harus positif'),
  outlet_id: z.number().int().positive('ID outlet harus positif'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  deleted_at: z.date().nullable().optional(),
});

// Schema untuk membuat produk baru (ID opsional, timestamps tidak diisi)
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
