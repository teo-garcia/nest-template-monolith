import { ApiProperty } from '@nestjs/swagger'

export class AppInfoDto {
  @ApiProperty({ example: 'NestJS Monolith Template' })
  name: string

  @ApiProperty({ enum: ['ok'] })
  status: string

  @ApiProperty({ example: '1' })
  version: string
}
