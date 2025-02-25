import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import Category from 'src/interfaces/category.interface';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import RequestWithUser from 'src/interfaces/request.interface';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createCategory(createCategoryDto: UpdateCategoryDto): Promise<any[]> {
    const supabaseClient = this.supabaseService.getClient();

    try {
      // Simpan data kategori ke database
      const { data, error } = await supabaseClient
        .from('categories')
        .insert([{ ...createCategoryDto, picture: 'category-default.jpg' }])
        .select();

      if (error) {
        throw new Error(`Gagal membuat kategori: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      throw new Error(`Gagal membuat kategori: ${error}`);
    }
  }

  // mupdate category
  async updateCategory(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto
  ) {
    const supabaseClient = this.supabaseService.getClient();

    const { data, error } = await supabaseClient
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', categoryId)
      .select();

    if (error) {
      throw new Error(`Gagal mengupdate kategori: ${error.message}`);
    }

    return data;
  }

  async updatePicture(file: Express.Multer.File, categoryId: string | number) {
    const supabaseClient = this.supabaseService.getClient();

    // Ambil data kategori
    const {
      data: category,
      error: categoryError,
    }: PostgrestSingleResponse<Category> = await supabaseClient
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single(); // Gunakan .single() karena Anda mengharapkan satu baris

    if (categoryError) {
      throw new Error(
        `Gagal mengambil data kategori: ${categoryError.message}`
      );
    }

    if (!category) {
      throw new Error('Kategori tidak ditemukan');
    }

    // Ambil path gambar lama dari kolom `picture`
    const oldPicturePath: string | null = category.picture;

    // Jika ada gambar lama, hapus dari storage
    if (oldPicturePath) {
      // Ekstrak nama file dari URL gambar lama
      const oldFileName = oldPicturePath.split('/').pop(); // Ambil nama file dari URL

      // Hapus file lama dari storage
      const { error: deleteError } = await supabaseClient.storage
        .from('pos')
        .remove([`categories/${oldFileName}`]);

      if (deleteError) {
        console.error('Gagal menghapus gambar lama:', deleteError.message);
        // Lanjutkan proses upload gambar baru meskipun gagal menghapus gambar lama
      }
    }

    // Ubah nama file untuk menghindari konflik
    // Tambahkan prefix 'categories/' untuk menyimpan di folder categories
    const fileName = `categories/${categoryId}-${file.originalname}-${Date.now()}`;

    // Upload file baru ke storage
    const { error: uploadError } = await supabaseClient.storage
      .from('pos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Gagal mengupload gambar: ${uploadError.message}`);
    }

    // Dapatkan URL publik untuk gambar yang diupload
    const { data: urlData } = supabaseClient.storage
      .from('pos')
      .getPublicUrl(fileName);

    // Update kolom picture di tabel categories
    const { data: updatedCategory, error: updateError } = await supabaseClient
      .from('categories')
      .update({
        picture: urlData.publicUrl,
      })
      .eq('id', categoryId)
      .select();

    if (updateError) {
      throw new Error(`Gagal mengupdate gambar: ${updateError.message}`);
    }

    return updatedCategory;
  }

  async getAllCategories() {
    try {
      const supabaseClient = this.supabaseService.getClient();

      // Mengambil semua data kategori
      const { data, error }: PostgrestSingleResponse<Category[]> =
        await supabaseClient.from('categories').select('*');

      if (error) {
        throw new Error(`Gagal mengambil data kategori: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return []; // Mengembalikan array kosong jika tidak ada kategori
      }

      // Mengambil signed URL untuk gambar default
      const { data: defaultImageData, error: defaultImageError } =
        await supabaseClient.storage
          .from('pos')
          .createSignedUrl('categories/category-default.jpg', 3600);

      // URL gambar default
      const defaultImageUrl =
        !defaultImageError && defaultImageData
          ? defaultImageData.signedUrl
          : null;

      // Mengambil signed URL untuk setiap gambar kategori
      const categoriesWithSignedUrls = await Promise.all(
        data.map(async (category) => {
          let pictureUrl = defaultImageUrl; // Gunakan gambar default sebagai nilai awal

          if (category.picture && category.picture !== 'category-default.jpg') {
            // Ekstrak ID gambar dari URL atau gunakan ID kategori
            const pictureId =
              category.picture.split('/').pop() || category.id.toString();

            const { data: urlData, error: urlError } =
              await supabaseClient.storage
                .from('pos')
                .createSignedUrl(`categories/${pictureId}`, 3600); // URL valid selama 1 jam

            if (!urlError && urlData) {
              pictureUrl = urlData.signedUrl;
            } else {
              console.error(
                `Gagal mendapatkan URL gambar untuk kategori ${category.id}, menggunakan gambar default:`,
                urlError?.message
              );
            }
          }

          // Mengembalikan kategori dengan URL gambar yang diperbarui
          return {
            ...category,
            picture: pictureUrl,
          };
        })
      );

      return categoriesWithSignedUrls;
    } catch (error) {
      throw new Error(`Gagal mengambil data kategori: ${error}`);
    }
  }

  async getCategoryById(req: RequestWithUser, categoryId: string) {
    try {
      const supabaseClient = this.supabaseService.getClient();

      // Mengambil data kategori
      const { data, error }: PostgrestSingleResponse<Category> =
        await supabaseClient
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single(); // Menggunakan single() untuk mendapatkan satu objek, bukan array

      if (error) {
        throw new Error(`Gagal mengambil data kategori: ${error.message}`);
      }

      if (!data) {
        return null; // Mengembalikan null jika kategori tidak ditemukan
      }

      // Mengambil URL gambar yang sudah ditandatangani
      let pictureUrl = 'category-default.jpg';

      if (data.picture) {
        // Ekstrak ID gambar dari URL atau gunakan ID kategori jika perlu
        const pictureId =
          data.picture.split('/').pop() || categoryId.toString();

        const { data: urlData, error: urlError } = await supabaseClient.storage
          .from('pos')
          .createSignedUrl(`categories/${pictureId}`, 3600); // URL valid selama 1 jam

        if (!urlError && urlData) {
          pictureUrl = urlData.signedUrl;
        } else {
          console.error('Gagal mendapatkan URL gambar:', urlError?.message);
        }
      }

      // Mengembalikan data kategori dengan URL gambar yang diperbarui
      return {
        ...data,
        picture: pictureUrl,
      };
    } catch (error) {
      throw new Error(`Gagal mengambil data kategori: ${error}`);
    }
  }
}
