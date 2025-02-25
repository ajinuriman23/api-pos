import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import RequestWithUser from 'src/interfaces/request.interface';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Mengambil semua produk berdasarkan role user.
   * @param req Request dengan user dan outlet yang terautentikasi.
   * @returns Daftar produk.
   */
  async findAll(req: RequestWithUser): Promise<Product[]> {
    const supabaseClient = this.supabaseService.getClient();

    try {
      let query = supabaseClient
        .from('products')
        .select('*')
        .is('deleted_at', null); // Hanya ambil data yang belum dihapus

      // Jika role user adalah manager, filter berdasarkan outlet_id
      if (
        req.user?.role === 'manager' &&
        req.outlet &&
        !Array.isArray(req.outlet)
      ) {
        query = query.eq('outlet_id', req.outlet.id);
      }

      const { data, error }: PostgrestSingleResponse<Product[]> = await query;

      if (error) {
        throw new BadRequestException(
          `Gagal mengambil data produk: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        throw new NotFoundException('Tidak ada produk yang ditemukan');
      }

      return data;
    } catch (error) {
      throw new BadRequestException(`Gagal mengambil data produk: ${error}`);
    }
  }

  /**
   * Membuat produk baru.
   * @param req Request dengan user yang terautentikasi.
   * @param createProductDto Data untuk membuat produk baru.
   * @returns Produk yang baru dibuat.
   */
  async create(
    req: RequestWithUser,
    createProductDto: CreateProductDto
  ): Promise<Product[]> {
    const supabaseClient = this.supabaseService.getClient();

    try {
      const user = req.user;

      if (!user) {
        throw new ForbiddenException('Pengguna tidak terautentikasi');
      }

      // Validasi outlet_id untuk owner
      if (user.role === 'owner' && !createProductDto.outlet_id) {
        throw new BadRequestException('Outlet ID harus disediakan');
      }

      // Jika role adalah manager, gunakan outlet_id dari request
      if (user.role === 'manager') {
        if (
          !req.outlet ||
          (Array.isArray(req.outlet) && req.outlet.length === 0)
        ) {
          throw new NotFoundException('Data outlet tidak ditemukan');
        }

        const outletData = Array.isArray(req.outlet)
          ? req.outlet[0]
          : req.outlet;

        createProductDto.outlet_id = Number(outletData.id);
      }

      // Validasi category_id
      const { data: categoryData, error: categoryError } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('id', createProductDto.category_id)
        .single();

      if (categoryError || !categoryData) {
        throw new NotFoundException(
          `Kategori tidak ditemukan: ${categoryError?.message || 'ID kategori tidak valid'}`
        );
      }

      // Insert data produk
      const { data, error }: PostgrestSingleResponse<Product[]> =
        await supabaseClient.from('products').insert(createProductDto).select();

      if (error) {
        throw new BadRequestException(`Gagal membuat produk: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new BadRequestException(`Gagal membuat produk: ${error}`);
    }
  }

  /**
   * Mengambil satu produk berdasarkan ID.
   * @param req Request dengan user yang terautentikasi.
   * @param id ID produk yang dicari.
   * @returns Produk yang ditemukan.
   */
  async findOne(req: RequestWithUser, id: number): Promise<Product> {
    try {
      const supabaseClient = this.supabaseService.getClient();

      let query = supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null);

      if (
        (req.user?.role === 'manager' || req.user?.role === 'staff') &&
        req.outlet &&
        !Array.isArray(req.outlet)
      ) {
        query = query.eq('outlet_id', req.outlet.id);
      }

      const { data, error }: PostgrestSingleResponse<Product[]> = await query;

      if (error) {
        throw new BadRequestException(
          `Gagal mengambil data produk: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        throw new NotFoundException('Produk tidak ditemukan');
      }

      return data[0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Gagal mengambil data produk: ${error}`);
    }
  }

  /**
   * Mengupdate produk berdasarkan ID.
   * @param req Request dengan user yang terautentikasi.
   * @param id ID produk yang akan diupdate.
   * @param updateProductDto Data untuk mengupdate produk.
   * @returns Produk yang telah diupdate.
   */
  async update(
    req: RequestWithUser,
    id: number,
    updateProductDto: UpdateProductDto
  ): Promise<Product[]> {
    const supabaseClient = this.supabaseService.getClient();

    try {
      let query = supabaseClient
        .from('products')
        .update(updateProductDto)
        .eq('id', id);

      // Jika role adalah manager, filter berdasarkan outlet_id
      if (
        req.user?.role === 'manager' &&
        req.outlet &&
        !Array.isArray(req.outlet)
      ) {
        const {
          data: productData,
          error: productError,
        }: PostgrestSingleResponse<Product> = await supabaseClient
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('outlet_id', req.outlet.id)
          .single();

        if (productError || !productData) {
          throw new NotFoundException(
            `Produk tidak ditemukan: ${productError?.message || 'ID produk tidak valid'}`
          );
        }

        query = query.eq('outlet_id', req.outlet.id);
      }

      const { data, error }: PostgrestSingleResponse<Product[]> =
        await query.select();

      if (error) {
        throw new BadRequestException(
          `Gagal mengupdate produk: ${error.message}`
        );
      }

      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Menghapus produk secara soft delete.
   * @param req Request dengan user yang terautentikasi.
   * @param id ID produk yang akan dihapus.
   * @returns Produk yang telah dihapus.
   */
  async remove(req: RequestWithUser, id: number): Promise<Product[]> {
    const supabaseClient = this.supabaseService.getClient();
    const deletedAt = new Date().toISOString();

    try {
      let query = supabaseClient
        .from('products')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      // Jika role adalah manager, filter berdasarkan outlet_id
      if (
        req.user?.role === 'manager' &&
        req.outlet &&
        !Array.isArray(req.outlet)
      ) {
        const {
          data: productData,
          error: productError,
        }: PostgrestSingleResponse<Product> = await supabaseClient
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('outlet_id', req.outlet.id)
          .single();

        if (productError || !productData) {
          throw new NotFoundException(
            `Produk tidak ditemukan: ${productError?.message || 'ID produk tidak valid'}`
          );
        }

        query = query.eq('outlet_id', req.outlet.id);
      }

      const { data, error }: PostgrestSingleResponse<Product[]> =
        await query.select();

      if (error) {
        throw new BadRequestException(
          `Gagal menghapus produk: ${error.message}`
        );
      }

      return data;
    } catch (error) {
      throw new BadRequestException(`Gagal menghapus produk: ${error}`);
    }
  }
}
