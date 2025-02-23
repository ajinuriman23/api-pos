import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import RequestWithUser from 'src/interfaces/request.interface';

export const MyOutlet = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    // Ambil data outlet dari request
    const outlets = request.outlet;

    return outlets || null;

  },
);