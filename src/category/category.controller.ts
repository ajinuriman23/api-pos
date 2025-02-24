import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation/zod-validation.pipe';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import { CreateCategoryDto, CreateCategorySchema } from './dto/create-category.dto';
import { SupabaseAuthGuard } from 'src/common/guards/auth/auth/auth.guard';

@Controller('categories')
@UseGuards(SupabaseAuthGuard, RoleGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('owner', 'manager')
  @UseInterceptors(FileInterceptor('picture'))
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile('picture') picture: Express.Multer.File,
  ) {
    return this.categoryService.createCategory(createCategoryDto, picture);
  }
}