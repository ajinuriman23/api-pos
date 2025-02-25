import { CreateCategorySchema } from '../dto/create-category.dto';
import { z } from 'zod';

export type Category = z.infer<typeof CreateCategorySchema>;
