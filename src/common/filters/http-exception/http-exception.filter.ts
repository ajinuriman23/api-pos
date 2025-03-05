import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AxiosError, isAxiosError } from 'axios';

type ErrorResponse = {
  message: string;
  error?: string | null;
};

interface CloudflareRequest extends Request {
  cf?: {
    city?: string;
    region?: string;
    isProxy?: boolean;
  };
  ip: string;
  user?: {
    id?: string;
    email?: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CloudflareRequest>();

    // Debug log untuk melihat data mentah
    console.log('Raw Request:', {
      headers: request.headers,
      method: request.method,
      url: request.url,
      ip: request.ip,
      body: request.body,
    });
    this.logger.info('Raw Request:', {
      headers: request.headers,
      method: request.method,
      url: request.url,
      ip: request.ip,
      body: request.body,
    });

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | undefined;
    let errorDetails: any = null;

    if (isAxiosError(exception)) {
      const axiosError = exception as AxiosError;
      status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      message = axiosError.message || 'Internal Server Error';
      errorDetails = {
        data: axiosError.response?.data,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        stack: axiosError.stack,
      };
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation Error';
      errorDetails = exception.errors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        const errResp = errorResponse as ErrorResponse;
        message = errResp.message || exception.message;
        errorDetails = errResp.error || null;
      }
    }

    // Format log dengan struktur yang lebih sederhana
    this.logger.error(message || 'Internal Server Error', {
      error: exception.message,
      formattedMetadata: {
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          ip: request.ip,
          body: request.body,
        },
        response: {
          status: status,
          headers: response.getHeaders(),
        },
        error: {
          name: exception.name,
          message: exception.message,
          stack:
            process.env.NODE_ENV !== 'production' ? exception.stack : undefined,
        },
        custom_data: {
          timestamp: Date.now(),
        },
      },
    });

    // Log security event
    this.logger.warn('Security Event', {
      auth: {
        userId: request.user?.id,
        email: request.user?.email,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        action: 'failed_login',
        timestamp: Date.now(),
        geoLocation: {
          country: request.headers['cf-ipcountry'],
          city: request.cf?.city,
          region: request.cf?.region,
        },
        cfRay: request.headers['cf-ray'],
      },
      request: {
        method: request.method,
        path: request.url,
        headers: {
          'x-forwarded-for': request.headers['x-forwarded-for'],
          'cf-connecting-ip': request.headers['cf-connecting-ip'],
          'user-agent': request.headers['user-agent'],
          origin: request.headers['origin'],
          referer: request.headers['referer'],
        },
      },
      suspicious: {
        reason: 'Multiple failed login attempts',
        score: 0.8,
        isProxy: request.cf?.isProxy,
      },
    });

    // Format response error standar
    response.status(status).json({
      statusCode: status,
      message: message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorDetails,
      stack: exception.stack,
    });
  }
}
