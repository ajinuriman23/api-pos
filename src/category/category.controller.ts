import {
  Controller,
  Post,
  Body,
  UsePipes,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Get,
  Req,
  Patch,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation/zod-validation.pipe';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import { CreateCategorySchema } from './dto/create-category.dto';
import { SupabaseAuthGuard } from 'src/common/guards/auth/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/interfaces/request.interface';
import { UpdateCategorySchema } from './dto/update-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(SupabaseAuthGuard, RoleGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // get all categories
  @Get()
  @Roles('owner', 'manager')
  async getAllCategories() {
    return this.categoryService.getAllCategories();
  }

  // get category by id
  @Get(':categoryId')
  @Roles('owner', 'manager')
  async getCategoryById(
    @Req() req: RequestWithUser,
    @Param('categoryId') categoryId: string
  ) {
    return this.categoryService.getCategoryById(req, categoryId);
  }

  // create category
  @Post()
  @Roles('owner', 'manager')
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async createCategory(@Body() createCategoryDto: UpdateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  // update category
  @Patch(':categoryId')
  @Roles('owner', 'manager')
  @UsePipes(new ZodValidationPipe(UpdateCategorySchema))
  async updateCategory(
    @Req() req: RequestWithUser,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    console.log(req.params.categoryId);
    return this.categoryService.updateCategory(
      req.params.categoryId,
      updateCategoryDto
    );
  }

  // upload file picture
  @Post(':categoryId/update-picture')
  @Roles('owner', 'manager')
  @UseInterceptors(FileInterceptor('picture'))
  uploadPicture(
    @UploadedFile() file: Express.Multer.File,
    @Param('categoryId') categoryId: string
  ) {
    return this.categoryService.updatePicture(file, categoryId);
  }
}
