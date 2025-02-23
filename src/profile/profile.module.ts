import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, SupabaseService],
})
export class ProfileModule {}
