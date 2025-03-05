import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import RequestWithUser from 'src/interfaces/request.interface';

@Injectable()
export class OutletStatusGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
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
