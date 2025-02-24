import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createCategory(createCategoryDto: CreateCategoryDto, picture: Express.Multer.File) {
    const supabaseClient = this.supabaseService.getClient();
  
    try {
      let pictureUrl: string | null = null;
  
      // Jika ada file gambar, upload ke Supabase Storage
      if (picture) {
        console.log('File:', picture);
        console.log('Buffer:', picture.buffer);
        console.log('Mimetype:', picture.mimetype);
  
        const picturePath = `categories/${Date.now()}-${picture.originalname}`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('pos') // Nama bucket di Supabase Storage
          .upload(picturePath, picture.buffer, {
            contentType: picture.mimetype,
          });
  
        if (uploadError) {
          throw new Error(`Gagal mengupload gambar: ${uploadError.message}`);
        }
  
        // Dapatkan URL gambar yang diupload
        const { data: urlData } = supabaseClient.storage
          .from('pos')
          .getPublicUrl(picturePath);
  
        pictureUrl = urlData.publicUrl;
      } else {
        throw new Error('Gambar tidak ditemukan');
      }
  
      // Simpan data kategori ke database
      const { data, error } = await supabaseClient
        .from('categories')
        .insert([{ ...createCategoryDto, picture: pictureUrl }])
        .select();
  
      if (error) {
        throw new Error(`Gagal membuat kategori: ${error.message}`);
      }
  
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw new Error(`Gagal membuat kategori: ${error.message}`);
    }
  }
}