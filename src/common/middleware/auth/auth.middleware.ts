import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { Response, NextFunction } from 'express';
import Outlet from 'src/interfaces/outlet.interface';
import RequestWithUser from 'src/interfaces/request.interface';
import SupabaseError from 'src/interfaces/supabase-error.interface';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly supabaseService: SupabaseService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const token = req.header('authorization')?.split(' ')[1];

    // cek re body
    if (!token) {
      return next();
    }

    try {
      // Verifikasi token menggunakan Supabase
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.getUser(token);

      if (authError) {
        throw new UnauthorizedException('Token tidak valid');
      }

      // Ambil data user dari tabel `users`
      const {
        data: userData,
        error: userError,
      }: { data: User | null; error: any } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('account_id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new UnauthorizedException('Data pengguna tidak ditemukan');
      }

      // Tambahkan user ke request
      req.user = {
        id: userData.id,
        email: userData.email || '',
        role: userData.role || 'staff', // Default role jika tidak ada
        app_metadata: userData.app_metadata || {},
        user_metadata: userData.user_metadata || {},
        aud: userData.aud || '',
        created_at: userData.created_at || '',
      };

      // Ambil data outlet berdasarkan role user
      if (userData.role === 'owner') {
        // Jika role adalah owner, ambil semua outlet
        const { data: outletData, error: outletError } =
          await this.supabaseService.getClient().from('outlets').select('*');

        if (outletError) {
          req.outlet = outletData; // Simpan semua outlet di request
        }
      } else if (userData.role === 'manager' || userData.role === 'staff') {
        // Jika role adalah manager, ambil outlet berdasarkan outlet_id

        // ambil user_outlet_id dari userid
        const { data: userOutletData, error: userOutletError } =
          await this.supabaseService
            .getClient()
            .from('user_outlet')
            .select('outlet_id')
            .eq('user_id', userData.id)
            .single();

        if (userOutletError) {
          throw new Error(userOutletError.message);
        }

        const {
          data: outletData,
          error: outletError,
        }: { data: Outlet | null; error: SupabaseError | null } =
          await this.supabaseService
            .getClient()
            .from('outlets')
            .select('*')
            .eq('id', userOutletData?.outlet_id)
            .single();

        if (outletError) {
          throw new Error(outletError.message);
        }

        if (outletData) {
          req.outlet = outletData; // Simpan outlet di request
        }
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Terjadi kesalahan saat memverifikasi token'
      );
    }
  }
}
