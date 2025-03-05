import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformResponseInterceptor } from './common/interceptors/transform-response/transform-response.interceptor';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import { WinstonLoggerConfig } from './common/config/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(WinstonLoggerConfig),
  });
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useLogger(app.get(WINSTON_MODULE_PROVIDER));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
