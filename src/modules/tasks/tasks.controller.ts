import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'

import { TaskStatus } from '../../generated/prisma/client'
import { ErrorEnvelopeDto } from '../../shared/dto'
import { CreateTaskDto, PaginatedTasksResponseDto, UpdateTaskDto } from './dto'
import { TasksService } from './tasks.service'

@ApiTags('Tasks')
@ApiExtraModels(PaginatedTasksResponseDto, ErrorEnvelopeDto)
@ApiBadRequestResponse({ type: ErrorEnvelopeDto })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private parsePositiveInteger(
    name: string,
    value: string | undefined,
    defaultValue: number,
    max?: number
  ): number {
    if (value === undefined) {
      return defaultValue
    }

    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${name} must be a positive integer`)
    }

    const parsed = Number.parseInt(value, 10)
    if (parsed < 1 || (max !== undefined && parsed > max)) {
      const upperBound =
        max === undefined ? '' : ` and less than or equal to ${max}`
      throw new BadRequestException(
        `${name} must be a positive integer${upperBound}`
      )
    }

    return parsed
  }

  /**
   * Create a new task
   *
   * @param createTaskDto - Task data from request body
   * @returns Created task
   *
   * Example request:
   * POST /api/tasks
   * {
   *   "title": "Complete documentation",
   *   "description": "Write API docs for the tasks module",
   *   "priority": 5
   * }
   */
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto)
  }

  /**
   * Get all tasks with optional filtering
   *
   * @param status - Optional filter by task status
   * @param priority - Optional filter for minimum priority
   * @returns Paginated tasks
   *
   * Examples:
   * GET /api/tasks
   * GET /api/tasks?status=PENDING
   * GET /api/tasks?priority=5
   * GET /api/tasks?status=IN_PROGRESS&priority=3
   */
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiOkResponse({ type: PaginatedTasksResponseDto })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    // Parse priority to number if provided
    const priorityNum = priority ? Number.parseInt(priority, 10) : undefined
    return this.tasksService.findAll({
      status,
      priority: priorityNum,
      page: this.parsePositiveInteger('page', page, 1),
      pageSize: this.parsePositiveInteger('pageSize', pageSize, 20, 100),
    })
  }

  /**
   * Get a specific task by ID
   *
   * @param id - Task ID from URL parameter
   * @returns Task data
   * @throws NotFoundException if task not found
   *
   * Example:
   * GET /api/tasks/clx1234567890
   */
  @Get(':id')
  @ApiNotFoundResponse({ type: ErrorEnvelopeDto })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id)
  }

  /**
   * Update a task
   *
   * @param id - Task ID from URL parameter
   * @param updateTaskDto - Fields to update
   * @returns Updated task
   * @throws NotFoundException if task not found
   *
   * Example request:
   * PATCH /api/tasks/clx1234567890
   * {
   *   "status": "COMPLETED"
   * }
   */
  @Patch(':id')
  @ApiNotFoundResponse({ type: ErrorEnvelopeDto })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto)
  }

  /**
   * Delete a task
   *
   * @param id - Task ID from URL parameter
   * @returns Deleted task
   * @throws NotFoundException if task not found
   *
   * Example:
   * DELETE /api/tasks/clx1234567890
   */
  @Delete(':id')
  @HttpCode(204)
  @ApiNotFoundResponse({ type: ErrorEnvelopeDto })
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id)
  }
}
