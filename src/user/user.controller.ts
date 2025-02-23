import { Controller, Req, ForbiddenException, Post, UsePipes, Body, UseGuards, Get, Patch, BadRequestException, Param, Delete } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UpdateUserSchema } from './dto/create-user.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation/zod-validation.pipe';
import { UserService } from './user.service';
import { CreateUserSchema } from './dto/create-user.schema';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import RequestWithUser from 'src/interfaces/request.interface';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { MyOutlet } from 'src/common/decorators/my-outlet/my-outlet.decorator';
import { SupabaseAuthGuard } from 'src/common/guards/auth/auth/auth.guard';
import { HttpStatus } from '@nestjs/common';
import { AddUserToOutletDto, AddUserToOutletSchema } from './dto/add-user-to-outlet.schema';



@Controller('users')
@UseGuards(RoleGuard)
export class UserController {

    constructor(private readonly userService: UserService) {}

    @Get('managers')
    @UseGuards(SupabaseAuthGuard)
    @Roles('owner')
    async getManager(@Req() req: RequestWithUser) {
        return this.userService.getManager();
    }

    @Patch('managers/:id')
    @UseGuards(SupabaseAuthGuard)
    @UseGuards(RoleGuard)
    @Roles('owner')
    @UsePipes(new ZodValidationPipe(UpdateUserSchema))
    async updateManager(
        @Req() req: RequestWithUser,  // Gunakan @Param() untuk mengambil parameter route
        @Body() updateUserDto: UpdateUserDto
    ) {
        try {
            const result = await this.userService.updateManager(+req.params.id, updateUserDto);
            return result;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('manager')
    @UsePipes(new ZodValidationPipe(CreateUserSchema))
    @UseGuards(RoleGuard)
    @Roles('owner')
    async createManager(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
        return this.userService.createManager(createUserDto);
    }

    @Delete('managers/:id')
    @UseGuards(SupabaseAuthGuard, RoleGuard)
    @Roles('owner')
    async deleteManager(@Req() req: RequestWithUser) {
        return this.userService.deleteManager(req.params.id);
    }

    // create staff
    @Post('staff')
    @UsePipes(new ZodValidationPipe(CreateUserSchema))
    @UseGuards(RoleGuard)
    @Roles('owner', 'manager')
    async createStaff(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
        return this.userService.createStaff(createUserDto, req.user);
    }

    @Get('staff')
    @UseGuards(SupabaseAuthGuard)
    @Roles('owner', 'manager')
    async getStaff(@Req() req: RequestWithUser, @MyOutlet() outlet: any) {
        return this.userService.getStaff(req, outlet.id);
    }

    @Patch('staff/:id')
    @UseGuards(SupabaseAuthGuard)
    @Roles('owner', 'manager')
    @UsePipes(new ZodValidationPipe(UpdateUserSchema))
    async updateStaff(@Req() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateStaff(+req.params.id, updateUserDto);
    }

    @Delete('staff/:id')
    @UseGuards(SupabaseAuthGuard)
    @Roles('owner', 'manager')
    async deleteStaff(
        @Req() req: RequestWithUser,
    ) {
        // Jika yang menghapus adalah owner, tidak perlu validasi outlet
        if (req.user?.role === 'owner') {
            return this.userService.deleteStaff(null, +req.params.id);
        }

        console.log(req.user?.role);
        
        // Jika manager, validasi outlet
        return this.userService.deleteStaff(req.user?.id || null, +req.params.id);
    }

    @Post('add-to-outlet')
    @UseGuards(SupabaseAuthGuard)
    @Roles('owner', 'manager')
    @UsePipes(new ZodValidationPipe(AddUserToOutletSchema))
    async addUserToOutlet(@Body() addUserToOutletDto: AddUserToOutletDto, @Req() req: RequestWithUser) {
        try {
            return this.userService.addUserToOutlet(addUserToOutletDto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
    
}

