import { RequestMethod } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'

import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './shared/filters'
import {
  RequestIdInterceptor,
  TransformInterceptor,
} from './shared/interceptors'
import { AppLogger } from './shared/logger/logger.service'
import { MetricsInterceptor } from './shared/metrics'
import { GlobalValidationPipe } from './shared/pipes'

/**
 * Bootstrap the monolith application
 *
 * Setup process:
 * 1. Create NestJS application
 * 2. Configure logger
 * 3. Register global middleware (validation, error handling, interceptors)
 * 4. Enable CORS if configured
 * 5. Enable graceful shutdown
 * 6. Start listening on configured port
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  // Get configuration
  const configService = app.get(ConfigService)
  const port = configService.get<number>('config.app.port') ?? 3000
  const apiPrefix = configService.get<string>('config.app.apiPrefix') ?? 'api'
  const appName =
    configService.get<string>('config.app.name') ?? 'NestJS Monolith Template'
  const appVersion = configService.get<string>('config.app.version') ?? '1'
  const corsEnabled = configService.get<boolean>('config.cors.enabled') ?? false
  const corsOrigin =
    configService.get<string>('config.cors.origin') ?? 'http://localhost:3000'

  // Setup logger
  const logger = app.get(AppLogger)
  logger.setContext('Bootstrap')
  app.useLogger(logger)

  app.use(helmet())

  // Set global API prefix
  // All routes will be prefixed with this (e.g., /api/users)
  // Health and metrics endpoints are excluded
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix, {
      exclude: [
        '',
        { path: '', method: RequestMethod.GET },
        'health',
        'health/live',
        'health/ready',
        'metrics',
        'docs',
      ],
    })
  }

  // Enable CORS if configured
  // In production, configure specific origins via CORS_ORIGIN env var
  if (corsEnabled) {
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    })
  }

  // Register global pipes, filters, and interceptors
  // Order matters: Request ID should be first to be available for other interceptors
  app.useGlobalPipes(new GlobalValidationPipe())
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(
    new RequestIdInterceptor(), // First: Generate request ID
    new TransformInterceptor(configService), // Second: Transform responses
    app.get(MetricsInterceptor) // Third: Record metrics
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setVersion(appVersion)
    .addServer(`http://localhost:${port}`)
    .build()
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, swaggerDocument)

  const shutdownTimeout =
    configService.get<number>('config.app.shutdownTimeout') ?? 10_000

  app.enableShutdownHooks()

  await app.listen(port)

  const baseUrl = `http://localhost:${port}`
  const fullUrl = apiPrefix ? `${baseUrl}/${apiPrefix}` : baseUrl
  logger.log(`${appName} v${appVersion} is running on: ${fullUrl}`)
  logger.log(`Metrics available at: ${baseUrl}/metrics`)
  logger.log(`Health check available at: ${baseUrl}/health`)
  logger.log(`API docs available at: ${baseUrl}/docs`)

  const forceExit = (signal: string) => {
    logger.log(`${signal} received, starting graceful shutdown...`)
    setTimeout(() => {
      logger.error(
        `Shutdown timed out after ${shutdownTimeout}ms, forcing exit`
      )
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }, shutdownTimeout).unref()
  }

  process.on('SIGTERM', () => forceExit('SIGTERM'))
  process.on('SIGINT', () => forceExit('SIGINT'))
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Start the application
// eslint-disable-next-line unicorn/prefer-top-level-await
bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  throw error
})
