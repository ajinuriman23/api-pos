import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  fullname: z.string().min(1, 'Nama lengkap harus diisi').optional(),
  email: z.string().email('Email tidak valid').optional(),
  password: z.string().min(6, 'Password harus memiliki setidaknya 6 karakter').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  role: z.enum(['owner', 'manager', 'staff']).default('staff'),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
