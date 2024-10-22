import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private users: User[] = [];

  async create(user: User): Promise<Omit<User, 'password'>> {
    const existingUser = this.getByEmail(user.email);

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    const newUser = {
      ...user,
      password: hashedPassword,
      id: this.users.length + 1,
    };
    this.users.push(newUser);

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  getById(id: number): Omit<User, 'password'> | undefined {
    const user = this.users.find((user) => user.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  }

  getByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  getAll(): Omit<User, 'password'>[] {
    return this.users.map(
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  deleteById(id: number) {
    this.users = this.users.filter((user) => user.id !== id);
  }
}
