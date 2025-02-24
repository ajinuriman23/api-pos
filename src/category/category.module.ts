import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, SupabaseService],
})
export class CategoryModule {}
