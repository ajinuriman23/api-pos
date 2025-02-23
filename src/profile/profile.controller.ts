import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import RequestWithUser from 'src/interfaces/request.interface';
import { SupabaseAuthGuard } from 'src/common/guards/auth/auth/auth.guard';

@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    if (req.user && req.user.id) {
      return this.profileService.findOne(+req.user?.id);
    } else {
      throw new Error('User ID is not defined');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(+id);
  }

  @Patch()
  update(@Req() req: RequestWithUser, @Body() updateProfileDto: UpdateProfileDto) {
    if (req.user && req.user.id) {
      console.log("check user id", req.user.id);
      return this.profileService.update(+req.user.id, updateProfileDto);
    } else {
      throw new Error('User ID is not defined');
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}
