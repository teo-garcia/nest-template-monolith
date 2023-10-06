import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async getAll(): Promise<Todo[]> {
    return this.todoRepository.find();
  }

  async getById(id: number): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id },
    });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async add(newTodo: Todo, userId: number): Promise<Todo> {
    newTodo.userId = userId;
    return this.todoRepository.save(newTodo);
  }

  async edit(id: number, updatedTodo: Todo, userId: number): Promise<Todo> {
    const existingTodo = await this.getById(id);

    if (existingTodo.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this todo',
      );
    }

    updatedTodo.id = id;
    return this.todoRepository.save(updatedTodo);
  }

  async delete(id: number): Promise<void> {
    // TODO: Adjust this
    await this.getById(id);
    await this.todoRepository.delete(id);
  }
}
