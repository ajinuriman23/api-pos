import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import RequestWithUser from 'src/interfaces/request.interface';

@Injectable()
export class OutletStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: RequestWithUser = context.switchToHttp().getRequest();

    const outlet = Array.isArray(request.outlet)
      ? request.outlet[0]
      : request.outlet;

    if (!outlet) {
      throw new BadRequestException('Outlet tidak ditemukan');
    }

    if (outlet.status === 'inactive') {
      throw new BadRequestException('Outlet sedang tutup');
    }

    return true;
  }
}
