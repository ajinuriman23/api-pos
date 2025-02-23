import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Ambil metadata 'roles' yang disimpan oleh decorator @Roles
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // Jika tidak ada peran yang diperlukan, izinkan akses
    if (!requiredRoles) {
      return true;
    }

    // Ambil data pengguna dari request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Jika pengguna tidak terautentikasi, tolak akses
    if (!user) {
      throw new ForbiddenException('Anda harus login untuk mengakses resource ini');
    }


    // Periksa apakah pengguna memiliki salah satu peran yang diperlukan
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengakses resource ini');
    }

    return true;
  }
}