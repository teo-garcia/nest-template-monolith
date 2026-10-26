import { Injectable, LoggerService, Scope } from '@nestjs/common'
import { Logger as WinstonLogger } from 'winston'

type LogMetadata = Record<string, unknown>
type LogParameter = LogMetadata | string | undefined

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string

  constructor(private readonly logger: WinstonLogger) {}

  setContext(context: string): void {
    this.context = context
  }

  log(message: string, ...meta: LogParameter[]): void {
    this.logger.info(message, {
      context: this.context,
      ...this.mergeMetadata(meta),
    })
  }

  error(message: string, trace?: string, ...meta: LogParameter[]): void {
    this.logger.error(message, {
      context: this.context,
      trace,
      ...this.mergeMetadata(meta),
    })
  }

  warn(message: string, ...meta: LogParameter[]): void {
    this.logger.warn(message, {
      context: this.context,
      ...this.mergeMetadata(meta),
    })
  }

  debug(message: string, ...meta: LogParameter[]): void {
    this.logger.debug(message, {
      context: this.context,
      ...this.mergeMetadata(meta),
    })
  }

  verbose(message: string, ...meta: LogParameter[]): void {
    this.logger.verbose(message, {
      context: this.context,
      ...this.mergeMetadata(meta),
    })
  }

  private mergeMetadata(parameters: LogParameter[]): LogMetadata {
    const metadata = parameters.filter(
      (value): value is LogMetadata =>
        typeof value === 'object' && value !== null && !Array.isArray(value)
    )
    const context = parameters.at(-1)
    return {
      ...Object.assign({}, ...metadata),
      ...(typeof context === 'string' ? { context } : {}),
    }
  }
}
