import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
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
      map((data) => {
        // Format response success
        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: data,
        };
      }),
      catchError((error) => {
        let status = 500;
        let message = 'Internal Server Error';
        let errorDetails: any = null;

        // Tangani error dari Zod
        if (error instanceof ZodError) {
          status = 400;
          message = 'Validation Error';
          errorDetails = error.errors.map((err) => ({
            code: err.code,
            message: err.message,
            path: err.path,
          }));
        }
        // Tangani error dari Supabase
        else if (error.message) {
          status = error.status || 500;
          message = error.message;
          errorDetails = error;
        }
        // Tangani error dari NestJS
        else if (error.response) {
          status = error.response.statusCode || 500;
          message = error.response.message || 'Internal Server Error';
          errorDetails = error.response;
        }

        // Set status code response
        response.status(status);

        // Format response error
        throw {
          statusCode: status,
          message: message, 
          error: errorDetails,
        };
      }),
    );
  }
}