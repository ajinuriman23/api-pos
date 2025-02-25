import { CreateUserSchema } from 'src/user/dto/create-user.schema';
import { z } from 'zod';

export const CreateOutletSchema = z.object({
  name: z.string({ required_error: 'Nama outlet harus diisi' }),
  address: z.string({ required_error: 'Alamat outlet harus diisi' }),
  status: z.enum(['active', 'inactive']).default('active'),
  // open_at: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam buka harus HH:MM'), // Format jam: HH:MM
  open_at: z.string(), // Format jam: HH:MM
  // closed_at: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam tutup harus HH:MM'), // Format jam: HH:MM
  closed_at: z.string(), // Format jam: HH:MM
  manager: CreateUserSchema, // Gunakan schema manager di sini
});

export const UpdateOutletSchema = CreateOutletSchema.partial();

export type CreateOutletDto = z.infer<typeof CreateOutletSchema>;
export type UpdateOutletDto = z.infer<typeof UpdateOutletSchema>;
