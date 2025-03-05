import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    // Log request
    this.logger.log(`Incoming Request: [${method}] ${url}`);

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Log success response dengan timing
        this.logger.log(
          `Response [${method}] ${url} completed in ${duration}ms`
        );
      }),
      map((data: unknown) => {
        // Transformasi response sukses
        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: data,
        };
      })
    );
  }
}
