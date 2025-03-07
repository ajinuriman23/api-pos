import { z } from 'zod';

export const AddUserToOutletSchema = z.object({
  user_id: z.number({ required_error: 'User ID harus diisi' }),
  outlet_id: z.number({ required_error: 'Outlet ID harus diisi' }),
});

export type AddUserToOutletDto = z.infer<typeof AddUserToOutletSchema>;
