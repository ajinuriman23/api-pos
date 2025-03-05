import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { XenditService } from 'src/xendit/xendit.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [TransactionController],
  providers: [TransactionService, XenditService, SupabaseService],
})
export class TransactionModule {}
