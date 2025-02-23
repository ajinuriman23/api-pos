import { createParamDecorator, ExecutionContext, SetMetadata, UnauthorizedException } from '@nestjs/common';
import RequestWithUser from 'src/interfaces/request.interface';

export const GetUser = createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<RequestWithUser>();
      
      if (!request.user) {
        throw new UnauthorizedException('User not found in request');
      }
      
      // Pastikan user object tidak hilang dengan membuat copy
      const user = { ...request.user };
      return user;
    },
  );