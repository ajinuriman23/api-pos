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
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import RequestWithUser from '../interfaces/request.interface';
import { SupabaseAuthGuard } from '../common/guards/auth/auth/auth.guard';
import { OutletStatusGuard } from '../common/guards/outlet-status.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('users') // Ubah dari 'user/' menjadi 'users'
  getCartByUser(@Req() req: RequestWithUser) {
    return this.cartService.getCartByUser(req);
  }

  @UseGuards(OutletStatusGuard)
  @Post()
  create(@Req() req: RequestWithUser, @Body() createCartDto: CreateCartDto) {
    return this.cartService.create(req, createCartDto);
  }

  @Post('reduce/:id')
  reduceQuantity(@Req() req: RequestWithUser, @Param('id') id: number) {
    return this.cartService.reduceQuantity(req, id);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.cartService.findAll(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
    @Req() req: RequestWithUser
  ) {
    return this.cartService.update(+id, updateCartDto, req);
  }

  @Delete('users')
  removeByUser(@Req() req: RequestWithUser) {
    return this.cartService.removeByUser(req);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }

  @Delete('product/:id')
  removeByProductId(@Param('id') id: string) {
    return this.cartService.removeByProductId(+id);
  }
}
