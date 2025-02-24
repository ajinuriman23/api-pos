import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOutletDto, CreateOutletSchema, UpdateOutletDto } from './dto/outlet.schema';

import { z } from 'zod';
import RequestWithUser from 'src/interfaces/request.interface';

@Injectable()
export class OutletService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getOutlets(req: RequestWithUser) {
    const supabaseClient = this.supabaseService.getClient();
    
    if (req.user && req.user.role === 'manager') {
      // Ambil outlet yang terkait dengan user melalui user_outlet
      const { data, error } = await supabaseClient
        .from('outlets')
        .select(`
          *,
          user_outlet!inner(
            user_id
          )
        `)
        .eq('user_outlet.user_id', req.user.id);

      if (error) {
        throw new Error(`Failed to fetch outlets: ${error.message}`);
      }

      return data;
    } else {
      // Ambil semua outlet jika tidak ada user id
      const { data, error } = await supabaseClient
        .from('outlets')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch outlets: ${error.message}`);
      }

      return data;
    }
}
  

  async createOutlet(outletDto: CreateOutletDto) {
    const supabaseClient = this.supabaseService.getClient();

    try {
      // Validasi outletDto menggunakan Zod
      const validatedOutletDto = CreateOutletSchema.parse(outletDto);

      // 1. Buat akun manager di Supabase Auth
      const { data: accountData, error: accountError } = await supabaseClient.auth.signUp({
        email: validatedOutletDto.manager.email,
        password: validatedOutletDto.manager.password,
      });

      if (accountError) {
        throw new BadRequestException(`Gagal membuat akun manager: ${accountError.message}`);
      }

      // 2. Insert outlet
      const { data: outletData, error: outletError } = await supabaseClient
        .from('outlets')
        .insert([
          {
            name: validatedOutletDto.name,
            address: validatedOutletDto.address,
            status: validatedOutletDto.status,
            open_at: validatedOutletDto.open_at,
            closed_at: validatedOutletDto.closed_at,
          },
        ])
        .select()
        .single();

      if (outletError) {
        // Rollback: Hapus akun manager jika insert outlet gagal
        await supabaseClient.auth.admin.deleteUser(accountData.user?.id ?? '');
        throw new BadRequestException(`Gagal membuat outlet: ${outletError.message}`);
      }


      validatedOutletDto.manager.role = 'manager'

      // 3. Insert manager ke tabel users
      const { data: managerData, error: managerError } = await supabaseClient
        .from('users')
        .insert([
          {
            fullname: validatedOutletDto.manager.fullname,
            email: validatedOutletDto.manager.email,
            role: validatedOutletDto.manager.role,  
            account_id: accountData.user?.id,
          },
        ])
        .select()
        .single();

      if (managerError) {
        // Rollback: Hapus outlet dan akun manager jika insert manager gagal
        await supabaseClient.from('outlets').delete().eq('id', outletData.id);
        await supabaseClient.auth.admin.deleteUser(accountData.user?.id ?? '');
        throw new BadRequestException(`Gagal membuat manager: ${managerError.message}`);
      }

      // 4. Insert user_outlet
      const { data: userOutletData, error: userOutletError } = await supabaseClient
        .from('user_outlet')
        .insert([{ user_id: managerData.id, outlet_id: outletData.id }])
        .select()
        .single();

      if (userOutletError) {
        // Rollback: Hapus manager, outlet, dan akun manager jika insert user_outlet gagal
        await supabaseClient.from('users').delete().eq('id', managerData.id);
        await supabaseClient.from('outlets').delete().eq('id', outletData.id);
        await supabaseClient.auth.admin.deleteUser(accountData.user?.id ?? '');
        throw new BadRequestException(`Gagal membuat user_outlet: ${userOutletError.message}`);
      }

      return {
        outlet: outletData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Jika validasi Zod gagal, lempar error validasi
        throw new BadRequestException(`Validasi gagal: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new BadRequestException(error.message);
    }
  }

  async updateOutlet(id: number, outletDto: UpdateOutletDto) {
    const supabaseClient = this.supabaseService.getClient();
    const { data, error } = await supabaseClient
      .from('outlets')
      .update(outletDto)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteOutlet(id: number) {

    try {
      const supabaseClient = this.supabaseService.getClient();
      const { data, error } = await supabaseClient.from('outlets').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }

      // hapus relasi user dengan outlet di user_outlet
      const { data: userOutletData, error: userOutletError } = await supabaseClient.from('user_outlet').delete().eq('outlet_id', id);
      if (userOutletError) {
        throw new Error(userOutletError.message);
      }

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // update outlet status
  async updateOutletStatus(id: number, status: string) {
    const supabaseClient = this.supabaseService.getClient();
    const { data, error } = await supabaseClient.from('outlets').update({ status }).eq('id', id).select();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

}