import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ProfileService {

  constructor(
    private supabaseService: SupabaseService,
  ) {}

  create(createProfileDto: CreateProfileDto) {
    return 'This action adds a new profile';  
  }

  findAll() {
    return `This action returns all profile`;
  }

  async findOne(id: number) {
    try {
      console.log(id);
      const { data, error } = await this.supabaseService.getClient().from("users").select('*').eq("id", id).single();
      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: number, updateProfileDto: UpdateProfileDto) {
    try {
      // Update user data di table users menggunakan admin client
      const { data, error } = await this.supabaseService.getAdminClient()
        .from("users")
        .update(updateProfileDto)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update user metadata menggunakan admin client
      const { data: userData, error: userError } = await this.supabaseService.getAdminClient()
        .from("users")
        .select("account_id")
        .eq("id", id)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      // Update metadata menggunakan admin client
      const { error: metadataError } = await this.supabaseService.getAdminClient()
        .auth.admin.updateUserById(userData.account_id, {
          user_metadata: {
            fullname: updateProfileDto.fullname,
            phone: updateProfileDto.phone
          }
        });

      if (metadataError) {
        throw new Error(metadataError.message);
      }

      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
