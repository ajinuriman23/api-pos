import { z } from 'zod';

// Schema untuk membuat kategori baru
export const CreateCategorySchema = z.object({
  name: z.string({ required_error: 'Nama kategori harus diisi' }),
  picture: z.any().optional(), 
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;