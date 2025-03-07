import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import RequestWithUser from '../interfaces/request.interface';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SupabaseAuthGuard } from '../common/guards/auth/auth/auth.guard';
import { RoleGuard } from '../common/guards/role/role.guard';
import { Roles } from '../common/decorators/roles/roles.decorator';
import { XenditWebhookSchema } from '../xendit/dto/webhook.dto';
import { XenditService } from '../xendit/xendit.service';
import { OutletStatusGuard } from '../common/guards/outlet-status.guard';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly xenditService: XenditService
  ) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @UseGuards(RoleGuard)
  @UseGuards(OutletStatusGuard)
  @Roles('manager', 'staff')
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser
  ) {
    return this.transactionService.create(req, createTransactionDto);
  }
  @UseGuards(SupabaseAuthGuard)
  @UseGuards(RoleGuard)
  @Roles('manager', 'staff')
  @Get()
  findAll() {
    return this.transactionService.findAll();
  }

  @UseGuards(SupabaseAuthGuard)
  @UseGuards(RoleGuard)
  @Roles('manager', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @UseGuards(SupabaseAuthGuard)
  @UseGuards(RoleGuard)
  @Roles('manager', 'staff')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @UseGuards(SupabaseAuthGuard)
  @UseGuards(RoleGuard)
  @Roles('manager', 'staff')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }

  @Post('callback')
  @UseGuards(OutletStatusGuard)
  callbackXendit(@Body() body: XenditWebhookSchema) {
    return this.xenditService.callbackXendit(body);
  }

  @Get('qr-code/:id')
  @UseGuards(OutletStatusGuard)
  getQrCode(@Param('id') id: string) {
    return this.xenditService.getQrCode(id);
  }

  @Post('qr-code/simulate-payment/:id')
  simulatePaymentQrCode(@Param('id') id: string) {
    return this.xenditService.simulatePaymentQrCode(id);
  }

  @Get('payment-request/:id')
  getPaymentRequest(@Param('id') id: string) {
    return this.xenditService.getPaymentRequest(id);
  }

  @Post('payment-request/simulate-payment/:id')
  simulatePaymentPaymentRequest(@Param('id') id: string) {
    return this.xenditService.simulatePaymentQrCode(id);
  }
}
