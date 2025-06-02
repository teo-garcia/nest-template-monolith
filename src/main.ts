import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters';
import { TransformInterceptor } from './shared/interceptors';
import { AppLogger } from './shared/logger/logger.service';
import { GlobalValidationPipe } from './shared/pipes';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get config values
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';

  // Set up logger
  const logger = app.get(AppLogger);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // Set global prefix if configured
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  // Register global pipes, filters, and interceptors
  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Start the application
  await app.listen(port);
  logger.log(
    `Application is running on: http://localhost:${port}${apiPrefix ? `/${apiPrefix}` : ''} ✨`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
