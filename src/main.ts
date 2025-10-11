import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './shared/filters'
import {
  RequestIdInterceptor,
  TransformInterceptor,
} from './shared/interceptors'
import { AppLogger } from './shared/logger/logger.service'
import { MetricsInterceptor } from './shared/metrics'
import { GlobalValidationPipe } from './shared/pipes'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  // Get config values
  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port') ?? 3000
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api'

  console.log(configService.get<number>('app.port'))

  // Set up logger
  const logger = app.get(AppLogger)
  logger.setContext('Bootstrap')
  app.useLogger(logger)

  // Set global prefix if configured
  // Exclude health and metrics endpoints from the prefix
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix, {
      exclude: ['health', 'health/live', 'health/ready', 'metrics'],
    })
  }

  // Register global pipes, filters, and interceptors
  // Order matters: Request ID should be first to be available for other interceptors
  app.useGlobalPipes(new GlobalValidationPipe())
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(
    new RequestIdInterceptor(), // First: Generate request ID
    new TransformInterceptor(), // Second: Transform responses
    app.get(MetricsInterceptor) // Third: Record metrics
  )

  // Enable graceful shutdown hooks
  // This ensures that the application cleans up resources properly on shutdown
  // Prisma will automatically handle cleanup via onModuleDestroy
  app.enableShutdownHooks()

  // Start the application
  await app.listen(port)

  // Fix nested template literal issue
  const baseUrl = `http://localhost:${port}`
  const fullUrl = apiPrefix ? `${baseUrl}/${apiPrefix}` : baseUrl
  logger.log(`Application is running on: ${fullUrl} ✨`)
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
})

// eslint-disable-next-line unicorn/prefer-top-level-await
bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  throw error
})
