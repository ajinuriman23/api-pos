import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { SupabaseAuthGuard } from 'src/common/guards/auth/auth/auth.guard';
import RequestWithUser from 'src/interfaces/request.interface';

@UseGuards(SupabaseAuthGuard, RoleGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('owner', 'manager')
  create(
    @Req() req: RequestWithUser,
    @Body() createProductDto: CreateProductDto
  ) {
    return this.productService.create(req, createProductDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.productService.findAll(req);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser) {
    return this.productService.findOne(req, +req.params.id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.update(req, +id, updateProductDto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.productService.remove(req, +id);
  }
}
