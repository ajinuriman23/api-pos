import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

interface CustomException {
  message?: string;
  error?: {
    message?: string;
  };
  getStatus?: () => number;
  getResponse?: () => string | { message: string };
}

interface ErrorResponse {
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: CustomException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as ErrorResponse).message || exception.message;
    }
    // Handle Supabase Auth Errors
    else if (
      typeof exception.message === 'string' &&
      exception.message.toLowerCase().includes('invalid login credentials')
    ) {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Email atau password salah';
    }
    // Handle other Supabase errors
    else if (exception.error?.message || exception.message) {
      message =
        exception.error?.message || exception.message || 'Unknown error';

      // Map Supabase error messages ke HTTP status
      if (message.includes('not found')) status = HttpStatus.NOT_FOUND;
      if (message.includes('already exists')) status = HttpStatus.CONFLICT;
      if (message.includes('not allowed')) status = HttpStatus.FORBIDDEN;
      if (message.includes('invalid')) status = HttpStatus.BAD_REQUEST;
      if (message.includes('unauthorized')) status = HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message || 'Data tidak ditemukan';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
