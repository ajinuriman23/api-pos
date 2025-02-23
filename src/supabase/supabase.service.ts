import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// supabase.service.ts
@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_KEY'),
      {
        auth: {
          persistSession: false
        }
      }
    );

    this.adminClient = createClient(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('Admin client not initialized');
    }
    return this.adminClient;
  }

  async verifyToken(token: string) {
    try {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error) throw error;
        return data.user; // Mengembalikan data pengguna
    } catch (error) {
        throw new Error('Invalid token');
    }
}
}