import { Module } from '@nestjs/common'

import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

/**
 * Tasks Module
 *
 * Feature module for task management.
 * Encapsulates all task-related functionality.
 *
 * Components:
 * - TasksController: HTTP request handling
 * - TasksService: Business logic and database operations
 *
 * Dependencies:
 * - PrismaModule: Database access (imported globally)
 */
@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
