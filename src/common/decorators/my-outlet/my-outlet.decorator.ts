import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import RequestWithUser from '../../../interfaces/request.interface';

export const MyOutlet = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    const outlets = request.outlet;

    return outlets || null;
  }
);
