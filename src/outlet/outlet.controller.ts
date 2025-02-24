import { Controller, Param, Put, ParseIntPipe, UsePipes, Body, Post, UseGuards, Req, Get, Patch, Delete } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation/zod-validation.pipe';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { GetUser } from 'src/common/decorators/user/user.decorator';
import { CreateOutletDto, CreateOutletSchema, UpdateOutletDto, UpdateOutletSchema } from './dto/outlet.schema';
import RequestWithUser from 'src/interfaces/request.interface';

@Controller('outlets')
@UseGuards(RoleGuard)
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Get()
  @Roles('owner', 'manager')
  async getOutlets(@Req() req: RequestWithUser) {
    return this.outletService.getOutlets(req);
  } 

  @Post()   
  @Roles('owner')
  @UsePipes(new ZodValidationPipe(CreateOutletSchema))
  async createOutlet(@Req() req: RequestWithUser, @Body() outletDto: CreateOutletDto) {
    return this.outletService.createOutlet(outletDto);
  }

  @Patch(':id')
  @Roles('owner')
  @UsePipes(new ZodValidationPipe(UpdateOutletSchema))    
  async updateOutlet(
    @Req() req: RequestWithUser,
    @Body() outletDto: UpdateOutletDto,
  ) {
    const outletId = req.params.id
    return this.outletService.updateOutlet(+outletId, outletDto);
  }

  @Delete(':id')
  @Roles('owner')
  async deleteOutlet(@Req() req: RequestWithUser) {
    const outletId = req.params.id
    return this.outletService.deleteOutlet(+outletId);
  }

  @Patch(':id/status')
  @Roles('owner')
  async updateOutletStatus(@Req() req: RequestWithUser, @Body() body: any) {
    const outletId = req.params.id
    return this.outletService.updateOutletStatus(+outletId, body.status);
  }
}
