import { z } from 'zod';

export const CreateUserSchema = z.object({
  fullname: z.string().min(1, 'Nama lengkap harus diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password harus memiliki setidaknya 6 karakter'),
  address: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  role: z.enum(['owner', 'manager', 'staff']).default('staff'),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;