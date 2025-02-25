import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, SupabaseService],
})
export class ProductModule {}
