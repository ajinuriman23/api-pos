import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Response } from 'express';
import { ZodError } from 'zod';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: data,
        };
      }),
      catchError((error) => {
        // Jika error adalah HttpException, teruskan ke ExceptionFilter
        if (error instanceof HttpException) {
          throw error;
        }

        let status = 500;
        let message = 'Internal Server Error';
        let errorDetails: any = null;

        if (error instanceof ZodError) {
          status = 400;
          message = 'Validation Error';
          errorDetails = error.errors.map((err) => ({
            code: err.code,
            message: err.message,
            path: err.path,
          }));
        } else if (error instanceof Error) {
          status = 500;
          message = error.message;
          errorDetails = error;
        }

        response.status(status);
        throw new HttpException(
          {
            statusCode: status,
            message: message,
            error: errorDetails as Record<string, unknown>,
          },
          status
        );
      })
    );
  }
}
