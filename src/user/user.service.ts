import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.schema';
import RequestWithUser from 'src/interfaces/request.interface';
import { AddUserToOutletDto } from './dto/add-user-to-outlet.schema';

@Injectable()
export class UserService {

    constructor(private readonly supabaseService: SupabaseService) {}

    async getManager() {
      const supabaseClient = this.supabaseService.getClient();
      
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('role', 'manager');
    
        if (error) {
          throw new Error(`Failed to fetch managers: ${error.message}`);
        }
    
        if (!data || data.length === 0) {
          return []; // Return empty array if no managers found
        }
    
        return data;
    
      } catch (error) {
        throw new Error(`Failed to fetch managers: ${error.message}`);
      }
    }

    async createManager(createUserDto: CreateUserDto) {
      const supabaseClient = this.supabaseService.getClient();
      createUserDto.role = 'manager';
    
      try {
        // Langkah 1: Daftarkan pengguna di Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email: createUserDto.email,
          password: createUserDto.password,
        });
    
        if (authError) {
          throw new Error(`Gagal mendaftarkan pengguna: ${authError.message}`);
        }
    
        // Langkah 2: Mulai transaksi database
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .insert([
            {
              fullname: createUserDto.fullname,
              email: createUserDto.email,
              address: createUserDto.address,
              phone: createUserDto.phone,
              photo_url: createUserDto.photo_url,
              role: createUserDto.role,
              account_id: authData.user?.id, // Simpan ID dari Supabase Auth
            },
          ])
          .select();
    
        if (userError) {
          // Jika gagal, hapus pengguna yang sudah terdaftar di Auth (rollback manual)
          await supabaseClient.auth.admin.deleteUser(authData.user?.id as string);
          throw new Error(`Gagal menambahkan data pengguna: ${userError.message}`);
        }

        
    
        return userData;
      } catch (error) {
        throw new Error(`Gagal membuat manager: ${error.message}`);
      }
    }

    async updateManager(id: number, updateUserDto: UpdateUserDto) {
      const supabaseClient = this.supabaseService.getClient();
       
      try {
          if (!id) {
              throw new Error('ID is undefined');
          }

          updateUserDto.role = 'manager';
  
          // Langsung update dan return hasilnya
          const { data, error } = await supabaseClient
              .from("users")
              .update(updateUserDto)
              .eq("id", id)
              .eq("role", "manager")  // Tambahan filter untuk memastikan yang diupdate adalah manager
              .select()
              .single();
  
          if (error) {
              throw new Error(error.message);
          }
  
          if (!data) {
              throw new Error("User dengan ID tersebut tidak ditemukan");
          }
  
          return data;
  
      } catch (error) {
          console.error("Error saat update:", error);
          throw new Error(`Gagal update manager: ${error.message}`);
      }
  }


  async deleteManager(id: string) {
    const supabaseClient = this.supabaseService.getAdminClient();
    try {
      
      const { data: userData, error: fetchUserError } = await supabaseClient.auth.admin.getUserById(id);
      if (fetchUserError) {
        throw new Error(`Failed to fetch account: ${fetchUserError.message}`);
      }

      // Get existing user first
      const { data: existingUser, error: fetchError } = await supabaseClient
        .from('users')
        .select('account_id, email')
        .eq('account_id', userData.user.id)
        .single();
  
      if (fetchError) {
        throw new Error(`Failed to fetch user: ${fetchError.message}`);
      }
  
      if (!existingUser?.account_id) {
        throw new Error('User account_id not found');
      }
      
      // Delete from users table first
      const { error: userError } = await supabaseClient
        .from('users')
        .delete()
        .eq('account_id', existingUser.account_id);
  
      if (userError) {
        throw new Error(`Failed to delete user data: ${userError.message}`);
      }
  
      // Then delete from auth
      const { error: authError } = await supabaseClient
        .auth.admin.deleteUser(existingUser.account_id);
  
      if (authError) {
        // Rollback: restore user data if auth delete fails
        await supabaseClient
          .from('users')
          .insert([existingUser]);
        throw new Error(`Failed to delete auth user: ${authError.message}`);
      }
  
      return "Berhasil Menghapus Manager";
    } catch (error) {
      throw new Error(`Failed to delete manager: ${error.message}`);
    }
  }
      

    async getStaff(req: RequestWithUser, outlet_id: number) {
      try {
        if (req.user && req.user?.role === 'owner') {
          const supabaseClient = this.supabaseService.getClient();
          const { data, error } = await supabaseClient
            .from('users')
            .select(`*`)
            .eq('role', 'staff')
      
          if (error) {
            throw new Error(`Failed to fetch staff: ${error.message}`);
          }

          return data;
        } else if (req.user && req.user?.role === 'manager') {
          const { data, error } = await this.supabaseService.getClient()
          .from('users')
          .select(`
            *,
            user_outlet!inner(
              outlet_id
            )
          `)
          .eq('role', 'staff')
          .eq('user_outlet.outlet_id', outlet_id);
      
        if (error) {
          throw new Error(`Failed to fetch staff: ${error.message}`);
        }
      
        return data;
        }
        
      
    } catch (error) {
      throw new Error(`Failed to fetch staff: ${error.message}`);
    }
  }

    async updateStaff(id: number, updateUserDto: UpdateUserDto) {
      try {
        const supabaseClient = this.supabaseService.getClient();
        updateUserDto.role = 'staff';

        const { data, error } = await supabaseClient
          .from('users')
          .update(updateUserDto)
          .eq('id', id)
          .eq('role', 'staff')
          .select();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to update staff: ${error.message}`);
      }
    }


    async deleteStaff(managerId: string | null, staffId: number) {
      try {
        const supabaseClient = this.supabaseService.getClient();
    
        // 1. Cek outlet manager yang melakukan request
        const { data: managerOutlet, error: managerError } = await supabaseClient
          .from('user_outlet')
          .select('outlet_id')
          .eq('user_id', managerId)
          .maybeSingle(); // <-- Gunakan maybeSingle
    
        if (managerError || !managerOutlet) {
          throw new Error('Manager tidak memiliki akses ke outlet manapun');
        }
    
        // 2. Cek apakah staff berada di outlet yang sama dengan manager
        const { data: staffOutlet, error: staffError } = await supabaseClient
          .from('user_outlet')
          .select('outlet_id')
          .eq('user_id', staffId)
          .eq('outlet_id', managerOutlet.outlet_id)
          .maybeSingle(); // <-- Gunakan maybeSingle
    
        if (staffError || !staffOutlet) {
          throw new Error('Staff tidak ditemukan di outlet yang Anda kelola');
        }
    
        // 3. Jika validasi berhasil, hapus staff
        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', staffId)
          .eq('role', 'staff');
    
        if (deleteError) {
          throw new Error(`Failed to delete staff: ${deleteError.message}`);
        }
    
        // 4. Hapus relasi di user_outlet
        const { error: userOutletError } = await supabaseClient
          .from('user_outlet')
          .delete()
          .eq('user_id', staffId)
          .eq('outlet_id', managerOutlet.outlet_id);
    
        if (userOutletError) {
          throw new Error(`Failed to delete user_outlet: ${userOutletError.message}`);
        }
    
        return { message: 'Staff berhasil dihapus' };
      } catch (error) {
        throw new Error(`Failed to delete staff: ${error.message}`);
      }
    }

    async createStaff(createUserDto: CreateUserDto, user: any) {
      const supabaseClient = this.supabaseService.getClient();
      const { email, password, fullname, address, phone, photo_url, role } = createUserDto;
    
      let authUserId: string | undefined;
      let userId: number | undefined;
    
      try {
        // Langkah 1: Daftarkan user di Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email,
          password,
        });
    
        if (authError) {
          throw new Error(`Gagal mendaftarkan user di Auth: ${authError.message}`);
        }
    
        authUserId = authData.user?.id; // Simpan ID user dari Auth
    
        // Langkah 2: Simpan data user ke tabel `users`
        createUserDto.role = 'staff';
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .insert([
            {
              fullname,
              email,
              address,
              phone,
              photo_url,
              role: createUserDto.role,
              account_id: authUserId,
            },
          ])
          .select()
          .single();
    
        if (userError || !userData) {
          throw new Error(`Gagal menyimpan data user: ${userError?.message}`);
        }
    
        userId = userData.id; // Simpan ID user dari tabel `users`
    
        // Langkah 3: Jika role manager, tambahkan relasi ke `user_outlet`
        if (user.role === 'manager') {
          // Ambil outlet_id dari manager
          const { data: managerOutlet, error: managerError } = await supabaseClient
            .from('user_outlet')
            .select('outlet_id')
            .eq('user_id', user.id)
            .maybeSingle();
    
          if (managerError || !managerOutlet) {
            throw new Error('Manager tidak memiliki outlet');
          }
    
          // Tambahkan relasi ke `user_outlet`
          const { error: userOutletError } = await supabaseClient
            .from('user_outlet')
            .insert([{ user_id: userId, outlet_id: managerOutlet.outlet_id }]);
    
          if (userOutletError) {
            throw new Error(`Gagal menambahkan relasi ke user_outlet: ${userOutletError.message}`);
          }
        }
    
        // Jika semua operasi berhasil, kembalikan data user
        return userData;
      } catch (error) {
        // Rollback manual jika terjadi error
        if (authUserId) {
          // Hapus user dari Supabase Auth jika sudah terdaftar
          await supabaseClient.auth.admin.deleteUser(authUserId);
        }
    
        if (userId) {
          // Hapus user dari tabel `users` jika sudah tersimpan
          await supabaseClient.from('users').delete().eq('id', userId);
        }
    
        throw new Error(`Gagal membuat staff: ${error.message}`);
      }
    }


    async addUserToOutlet(addUserToOutletDto: AddUserToOutletDto) {
      const supabaseClient = this.supabaseService.getClient();
    
      try {
        // Cek apakah user dan outlet sudah ada
        const { data: user, error: userError } = await supabaseClient
          .from('users')
          .select('id')
          .eq('id', addUserToOutletDto.user_id)
          .single();
    
        if (userError || !user) {
          throw new Error('User tidak ditemukan');
        }
    
        const { data: outlet, error: outletError } = await supabaseClient
          .from('outlets')
          .select('id')
          .eq('id', addUserToOutletDto.outlet_id)
          .single();
    
        if (outletError || !outlet) {
          throw new Error('Outlet tidak ditemukan');
        }
    
        // Tambahkan relasi ke user_outlet
        const { data: userOutlet, error: userOutletError } = await supabaseClient
          .from('user_outlet')
          .insert([{ user_id: addUserToOutletDto.user_id, outlet_id: addUserToOutletDto.outlet_id }])
          .select();
    
        if (userOutletError) {
          throw new Error(`Gagal menambahkan user ke outlet: ${userOutletError.message}`);
        }
    
        return userOutlet;
      } catch (error) {
        throw new Error(`Gagal menambahkan user ke outlet: ${error.message}`);
      }
    }
}
