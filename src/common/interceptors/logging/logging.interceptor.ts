import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const method = request.method;
    const url = request.url;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userAgent = request.headers['user-agent'] || '';
    const startTime = Date.now();

    // Log request
    this.logger.info(`[REQUEST] ${method} ${url}`, {
      method,
      url,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      userAgent,
      headers: request.headers,
      body: ['POST', 'PUT', 'PATCH'].includes(method)
        ? request.body
        : undefined,
    });

    return next.handle().pipe(
      finalize(() => {
        const duration = Date.now() - startTime;

        // Log response time
        this.logger.info(`[RESPONSE] ${method} ${url} - ${duration}ms`, {
          method,
          url,
          duration,
        });
      })
    );
  }
}
