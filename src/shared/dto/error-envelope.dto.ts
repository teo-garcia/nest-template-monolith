import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ErrorMetaDto {
  @ApiProperty()
  requestId: string
}

export class ErrorEnvelopeDto {
  @ApiProperty({ enum: [false] })
  success: false

  @ApiProperty({ minimum: 400 })
  statusCode: number

  @ApiProperty({ format: 'date-time' })
  timestamp: string

  @ApiProperty()
  path: string

  @ApiProperty()
  method: string

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[]

  @ApiPropertyOptional()
  error?: string

  @ApiPropertyOptional({
    additionalProperties: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  errors?: Record<string, string[]>

  @ApiPropertyOptional({ type: ErrorMetaDto })
  meta?: ErrorMetaDto
}
