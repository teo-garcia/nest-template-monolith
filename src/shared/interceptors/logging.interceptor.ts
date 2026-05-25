import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { trace } from '@opentelemetry/api'
import { Observable, tap } from 'rxjs'

import { AppLogger } from '../logger/logger.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const startedAt = process.hrtime.bigint()
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const spanContext = trace.getActiveSpan()?.spanContext()

    return next.handle().pipe(
      tap(() => {
        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000

        this.logger.log('request', {
          duration_ms: Number(durationMs.toFixed(2)),
          method: request.method,
          path: request.url,
          request_id: request.id,
          status: response.statusCode,
          ...(spanContext && {
            span_id: spanContext.spanId,
            trace_id: spanContext.traceId,
          }),
        })
      })
    )
  }
}
