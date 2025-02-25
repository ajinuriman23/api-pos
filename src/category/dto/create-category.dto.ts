import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string({ required_error: 'Nama kategori harus diisi' }),
});
