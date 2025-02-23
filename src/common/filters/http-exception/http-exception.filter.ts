import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle Supabase Auth Errors
    if (exception.message?.toLowerCase().includes('invalid login credentials')) {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Email atau password salah';
    }
    // Handle HTTP Exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any).message || exception.message;
    } 
    // Handle other Supabase errors
    else if (exception.error?.message || exception.message) {
      message = exception.error?.message || exception.message;
      
      // Map Supabase error messages ke HTTP status
      if (message.includes('not found')) status = HttpStatus.NOT_FOUND;
      if (message.includes('already exists')) status = HttpStatus.CONFLICT;
      if (message.includes('not allowed')) status = HttpStatus.FORBIDDEN;
      if (message.includes('invalid')) status = HttpStatus.BAD_REQUEST;
      if (message.includes('unauthorized')) status = HttpStatus.UNAUTHORIZED;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}