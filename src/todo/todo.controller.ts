import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { JWTAuthGuard } from '../auth/jwt-auth.guard';
import { User } from 'src/user/user.entity';

@Controller('todos')
@UseGuards(JWTAuthGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  async getAllTodos(): Promise<Array<Todo>> {
    return this.todoService.getAll();
  }

  @Get(':id')
  async getTodoById(@Param('id') id: number): Promise<Todo> {
    return this.todoService.getById(id);
  }

  @Post()
  async add(@Body() newTodo: Todo, @Request() req): Promise<Todo> {
    const user: User = req.user;
    return this.todoService.add(newTodo, user.id);
  }

  @Put(':id')
  async edit(
    @Param('id') id: number,
    @Body() updatedTodo: Todo,
  ): Promise<Todo> {
    return this.todoService.edit(id, updatedTodo);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    await this.todoService.delete(id);
  }
}
