import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import {
  PostgrestSingleResponse,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { Cart } from './entities/cart.entity';
import RequestWithUser from 'src/interfaces/request.interface';
import { Product } from 'src/product/entities/product.entity';
import Outlet from 'src/interfaces/outlet.interface';

@Injectable()
export class CartService {
  constructor(private supabaseService: SupabaseService) {}

  private getClient(): SupabaseClient {
    return this.supabaseService.getClient();
  }

  async create(
    req: RequestWithUser,
    createCartDto: CreateCartDto
  ): Promise<Cart[]> {
    const { product_id, quantity } = createCartDto;
    const supabaseClient = this.getClient();
    const userRole = req.user?.role;

    if (!userRole) {
      throw new BadRequestException('Role tidak valid');
    }

    // cek status outlet
    if (req.outlet) {
      const outletStatus = Array.isArray(req.outlet)
        ? req.outlet[0]?.status
        : req.outlet.status;

      if (outletStatus === 'inactive') {
        throw new BadRequestException('Outlet sedang tutup');
      }
    }

    const { staff_id, outlet_id } = await this.extractStaffAndOutletIds(
      req,
      createCartDto,
      userRole,
      supabaseClient
    );

    if (staff_id === undefined || outlet_id === undefined) {
      throw new BadRequestException('Staff ID atau Outlet ID tidak valid');
    }

    const existingCart = await this.findCartByProductAndUser(
      supabaseClient,
      product_id,
      staff_id,
      outlet_id
    );

    if (existingCart) {
      const updatedQuantity = existingCart.quantity + quantity;
      return this.updateCart(
        supabaseClient,
        product_id,
        staff_id,
        outlet_id,
        updatedQuantity
      );
    } else {
      return this.insertCart(
        supabaseClient,
        product_id,
        staff_id,
        outlet_id,
        quantity
      );
    }
  }

  private async extractStaffAndOutletIds(
    req: RequestWithUser,
    createCartDto: CreateCartDto,
    userRole: string,
    supabaseClient: SupabaseClient
  ): Promise<{ staff_id: number | undefined; outlet_id: number | undefined }> {
    let staff_id: number | undefined = undefined;
    let outlet_id: number | undefined = undefined;

    if (userRole === 'owner') {
      if (!createCartDto.outlet_id) {
        throw new BadRequestException(
          'Outlet ID harus disediakan untuk role owner'
        );
      }

      const outlet = await this.findOutletById(
        supabaseClient,
        createCartDto.outlet_id
      );
      if (!outlet) {
        throw new NotFoundException('Outlet tidak ditemukan');
      }

      outlet_id = createCartDto.outlet_id;
      staff_id = createCartDto.staff_id;

      const userOutlet = await this.findUserOutlet(
        supabaseClient,
        staff_id,
        outlet_id
      );
      if (!userOutlet) {
        throw new BadRequestException('Staff tidak terkait dengan outlet ini');
      }
    } else if (userRole === 'manager' || userRole === 'staff') {
      const outletData = this.getOutletFromRequest(req);
      outlet_id = Number(outletData.id);
      staff_id = Number(req.user?.id);

      const userOutlet = await this.findUserOutlet(
        supabaseClient,
        staff_id,
        outlet_id
      );
      if (!userOutlet) {
        throw new BadRequestException('User tidak terkait dengan outlet ini');
      }
    }

    return { staff_id, outlet_id };
  }

  private async findCartByProductAndUser(
    supabaseClient: SupabaseClient,
    product_id: number,
    staff_id: number,
    outlet_id: number
  ): Promise<Cart | null> {
    const { data: cart, error }: PostgrestSingleResponse<Cart | null> =
      await supabaseClient
        .from('carts')
        .select('*')
        .eq('product_id', product_id)
        .eq('staff_id', staff_id)
        .eq('outlet_id', outlet_id)
        .maybeSingle();

    if (error && error.message !== 'No rows found') {
      throw new BadRequestException(
        `Gagal mencari data cart: ${error.message}`
      );
    }

    return cart;
  }

  private async findOutletById(
    supabaseClient: SupabaseClient,
    outlet_id: number
  ) {
    const { data: outlet, error }: PostgrestSingleResponse<Outlet | null> =
      await supabaseClient
        .from('outlets')
        .select('*')
        .eq('id', outlet_id)
        .maybeSingle();

    if (error) {
      throw new BadRequestException(
        `Gagal mencari data outlet: ${error.message}`
      );
    }

    return outlet;
  }

  private async findUserOutlet(
    supabaseClient: SupabaseClient,
    user_id: number,
    outlet_id: number
  ) {
    const { data: userOutlet, error }: PostgrestSingleResponse<User | null> =
      await supabaseClient
        .from('user_outlet')
        .select('*')
        .eq('user_id', user_id)
        .eq('outlet_id', outlet_id)
        .maybeSingle();

    if (error) {
      throw new BadRequestException(
        `Gagal memverifikasi relasi user dan outlet: ${error.message}`
      );
    }

    return userOutlet;
  }

  private getOutletFromRequest(req: RequestWithUser) {
    if (!req.outlet || (Array.isArray(req.outlet) && req.outlet.length === 0)) {
      throw new NotFoundException('Data outlet tidak ditemukan');
    }

    return Array.isArray(req.outlet) ? req.outlet[0] : req.outlet;
  }

  private async updateCart(
    supabaseClient: SupabaseClient,
    product_id: number,
    staff_id: number,
    outlet_id: number,
    quantity: number
  ): Promise<Cart[]> {
    const { data: updatedCart, error } = await supabaseClient
      .from('carts')
      .update({ quantity })
      .eq('product_id', product_id)
      .eq('staff_id', staff_id)
      .eq('outlet_id', outlet_id)
      .select();

    if (error) {
      throw new BadRequestException(`Gagal mengupdate cart: ${error.message}`);
    }

    return updatedCart;
  }

  private async insertCart(
    supabaseClient: SupabaseClient,
    product_id: number,
    staff_id: number,
    outlet_id: number,
    quantity: number
  ): Promise<Cart[]> {
    const { data: newCart, error } = await supabaseClient
      .from('carts')
      .insert({ product_id, staff_id, outlet_id, quantity })
      .select();

    if (error) {
      throw new BadRequestException(`Gagal membuat cart: ${error.message}`);
    }

    return newCart;
  }

  async reduceQuantity(req: RequestWithUser, id: number) {
    const supabaseClient = this.getClient();
    const userRole = req.user?.role;

    const isOwner = userRole === 'owner';
    const outlet_id = isOwner ? this.getOutletIdFromRequest(req) : undefined;
    const staff_id = isOwner ? Number(req.user?.id) : undefined;

    if (isOwner && (!outlet_id || !staff_id)) {
      throw new BadRequestException('Outlet ID atau Staff ID tidak valid');
    }

    const cart = await this.findCartById(
      supabaseClient,
      id,
      outlet_id,
      staff_id
    );

    if (cart.quantity <= 0) {
      throw new BadRequestException('Quantity cart tidak boleh kurang dari 0');
    }

    const updatedQuantity = cart.quantity - 1;

    if (cart.quantity === 1) {
      await supabaseClient.from('carts').delete().eq('id', id);
      return [];
    }

    return this.updateCart(
      supabaseClient,
      cart.product_id,
      cart.staff_id,
      Number(cart.outlet_id),
      updatedQuantity
    );
  }

  private async findCartById(
    supabaseClient: SupabaseClient,
    id: number,
    outlet_id?: number,
    staff_id?: number
  ): Promise<Cart> {
    const { data: cart, error }: PostgrestSingleResponse<Cart | null> =
      await supabaseClient
        .from('carts')
        .select('*')
        .eq('id', id)
        .eq(outlet_id ? 'outlet_id' : '', outlet_id || '')
        .eq(staff_id ? 'staff_id' : '', staff_id || '')
        .maybeSingle();

    if (error) {
      throw new BadRequestException(
        `Gagal mencari data cart: ${error.message}`
      );
    }

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    return cart;
  }

  private getOutletIdFromRequest(req: RequestWithUser): number {
    const outletData = this.getOutletFromRequest(req);
    return Number(outletData.id);
  }

  async findAll(req: RequestWithUser) {
    const supabaseClient = this.getClient();
    const userRole = req.user?.role;

    if (!userRole) {
      throw new BadRequestException('Role tidak valid');
    }

    const carts =
      userRole === 'owner'
        ? await this.findAllCarts(supabaseClient)
        : await this.findCartsByStaffId(supabaseClient, Number(req.user?.id));

    if (carts.length === 0) {
      return [];
    }

    return this.enrichCartsWithProducts(supabaseClient, carts);
  }

  private async findAllCarts(supabaseClient: SupabaseClient): Promise<Cart[]> {
    const { data: carts, error } = await supabaseClient
      .from('carts')
      .select('*');

    if (error) {
      throw new BadRequestException('Gagal mencari data cart');
    }

    return carts;
  }

  private async findCartsByStaffId(
    supabaseClient: SupabaseClient,
    staff_id: number
  ): Promise<Cart[]> {
    const { data: carts, error } = await supabaseClient
      .from('carts')
      .select('*')
      .eq('staff_id', staff_id);

    if (error) {
      throw new BadRequestException(
        `Gagal mencari data cart: ${error.message}`
      );
    }

    return carts;
  }

  private async enrichCartsWithProducts(
    supabaseClient: SupabaseClient,
    carts: Cart[]
  ) {
    return Promise.all(
      carts.map(async (cart) => {
        const product = await this.findProductById(
          supabaseClient,
          cart.product_id
        );
        return { ...cart, product };
      })
    );
  }

  private async findProductById(
    supabaseClient: SupabaseClient,
    product_id: number
  ): Promise<Product> {
    const { data: product, error }: PostgrestSingleResponse<Product | null> =
      await supabaseClient
        .from('products')
        .select('*')
        .eq('id', product_id)
        .maybeSingle();

    if (error) {
      throw new BadRequestException('Gagal mencari data product');
    }

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    return product;
  }

  async findOne(id: number) {
    const supabaseClient = this.getClient();
    const cart = await this.findCartById(supabaseClient, id);
    const product = await this.findProductById(supabaseClient, cart.product_id);
    return { ...cart, product };
  }

  async getCartByUser(req: RequestWithUser) {
    const supabaseClient = this.getClient();
    const userRole = req.user?.role;

    if (!userRole) {
      throw new BadRequestException('Role tidak valid');
    }

    if (userRole === 'owner') {
      throw new BadRequestException('Owner tidak bisa melihat cart');
    }

    const carts = await this.findCartsByStaffId(
      supabaseClient,
      Number(req.user?.id)
    );

    if (carts.length === 0) {
      return [];
    }

    return this.enrichCartsWithProducts(supabaseClient, carts);
  }

  async update(id: number, updateCartDto: UpdateCartDto, req: RequestWithUser) {
    const supabaseClient = this.getClient();
    const userRole = req.user?.role;

    if (!userRole) {
      throw new BadRequestException('Role tidak valid');
    }

    const cart = await this.findCartById(supabaseClient, id);

    this.validateCartAccess(userRole, req, cart);

    const updatedCart = await this.updateCartWithDto(
      supabaseClient,
      id,
      updateCartDto,
      userRole,
      cart
    );

    return updatedCart;
  }

  private validateCartAccess(
    userRole: string,
    req: RequestWithUser,
    cart: Cart
  ) {
    if (userRole === 'manager') {
      const outletId = this.getOutletIdFromRequest(req);
      if (cart.outlet_id !== outletId) {
        throw new BadRequestException('Tidak memiliki akses ke cart ini');
      }
    } else if (userRole === 'staff') {
      if (cart.staff_id !== Number(req.user?.id)) {
        throw new BadRequestException('Tidak memiliki akses ke cart ini');
      }
    }
  }

  private async updateCartWithDto(
    supabaseClient: SupabaseClient,
    id: number,
    updateCartDto: UpdateCartDto,
    userRole: string,
    cart: Cart
  ) {
    const { data: updatedCart, error } = await supabaseClient
      .from('carts')
      .update({
        ...updateCartDto,
        outlet_id:
          userRole === 'staff' ? cart.outlet_id : updateCartDto.outlet_id,
        staff_id: userRole === 'owner' ? updateCartDto.staff_id : cart.staff_id,
      })
      .eq('id', id)
      .select();

    if (error) {
      throw new BadRequestException(`Gagal mengupdate cart: ${error.message}`);
    }

    return updatedCart;
  }

  async remove(id: number) {
    const supabaseClient = this.getClient();
    await this.deleteCartById(supabaseClient, id);
    return `Cart berhasil dihapus`;
  }

  private async deleteCartById(supabaseClient: SupabaseClient, id: number) {
    const { error } = await supabaseClient.from('carts').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Gagal menghapus cart: ${error.message}`);
    }
  }

  async removeByProductId(productId: number) {
    const supabaseClient = this.getClient();
    await this.validateProductExists(supabaseClient, productId);
    await this.deleteCartByProductId(supabaseClient, productId);
    return `Cart berhasil dihapus`;
  }

  private async validateProductExists(
    supabaseClient: SupabaseClient,
    productId: number
  ) {
    const product = await this.findProductById(supabaseClient, productId);
    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }
  }

  private async deleteCartByProductId(
    supabaseClient: SupabaseClient,
    productId: number
  ) {
    const { error } = await supabaseClient
      .from('carts')
      .delete()
      .eq('product_id', productId);

    if (error) {
      throw new BadRequestException(`Gagal menghapus cart: ${error.message}`);
    }
  }

  async removeByUser(req: RequestWithUser) {
    const supabaseClient = this.getClient();

    await this.deleteCartByStaffId(supabaseClient, Number(req.user?.id));
    return `Cart berhasil dihapus`;
  }

  private async deleteCartByStaffId(
    supabaseClient: SupabaseClient,
    staff_id: number
  ) {
    const { error } = await supabaseClient
      .from('carts')
      .delete()
      .eq('staff_id', staff_id);

    if (error) {
      throw new BadRequestException(`Gagal menghapus cart: ${error.message}`);
    }
  }
}
