import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  controllers: [CartController],
  providers: [CartService, SupabaseService],
})
export class CartModule {}
