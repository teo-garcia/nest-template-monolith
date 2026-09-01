import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Shared health contract.
 *
 * Deliberately identical to the frontend templates' `lib/health.ts` and to the
 * Adonis template's health report, so one client parser works against every
 * template in the portfolio. Do not reshape this to match a library's output.
 */
export type HealthStatus = 'ok' | 'degraded' | 'down'

export type HealthCheckState = 'up' | 'down'

/**
 * Aggregates individual dependency checks into the overall status:
 * every check up -> `ok`, some up -> `degraded`, none up -> `down`.
 */
export const resolveHealthStatus = (
  checks: Record<string, HealthCheckState>
): HealthStatus => {
  const states = Object.values(checks)

  if (states.length === 0 || states.every((state) => state === 'up')) {
    return 'ok'
  }

  if (states.every((state) => state === 'down')) {
    return 'down'
  }

  return 'degraded'
}

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded', 'down'] })
  status: HealthStatus

  @ApiProperty({ format: 'date-time' })
  timestamp: string

  @ApiProperty({ example: '1' })
  version: string

  @ApiPropertyOptional({
    additionalProperties: { type: 'string', enum: ['up', 'down'] },
    example: { database: 'up', redis: 'up' },
  })
  checks?: Record<string, HealthCheckState>
}
