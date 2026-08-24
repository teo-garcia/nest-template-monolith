import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SuccessMetaDto {
  @ApiPropertyOptional()
  requestId?: string

  @ApiPropertyOptional()
  version?: string

  @ApiPropertyOptional({ minimum: 0 })
  duration?: number
}

/**
 * The envelope every successful response is wrapped in by
 * `TransformInterceptor`. Endpoint payloads appear under `data`; use
 * `ApiEnvelopeResponse` so the documented schema matches the wire format.
 */
export class SuccessEnvelopeDto {
  @ApiProperty({ enum: [true] })
  success: true

  @ApiProperty({ minimum: 200, maximum: 399 })
  statusCode: number

  @ApiProperty({ format: 'date-time' })
  timestamp: string

  @ApiProperty()
  path: string

  @ApiProperty()
  method: string

  @ApiPropertyOptional({ type: SuccessMetaDto })
  meta?: SuccessMetaDto
}
