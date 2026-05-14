import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { TaskStatus } from '../../../generated/prisma/client'

export class TaskResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty({ example: 'Complete documentation', maxLength: 255 })
  title: string

  @ApiPropertyOptional({ example: 'Write API docs for the tasks module' })
  description?: string | null

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus

  @ApiProperty({ minimum: 0, maximum: 10 })
  priority: number

  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}

export class PaginationMetaDto {
  @ApiProperty({ minimum: 0 })
  total: number

  @ApiProperty({ minimum: 1 })
  page: number

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize: number
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[]

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto
}
