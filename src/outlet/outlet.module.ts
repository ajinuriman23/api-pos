import { Module } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { OutletController } from './outlet.controller';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  providers: [OutletService, SupabaseService],
  controllers: [OutletController]
})
export class OutletModule {}
