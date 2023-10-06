import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SignUpDto } from 'src/auth/auth.types';
import { hash, compare } from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async getByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async add(signUpDto: SignUpDto): Promise<User> {
    const { username, password } = signUpDto;

    // Check if the username is already taken
    const existingUser = await this.getByUsername(username);

    if (existingUser) {
      throw new ConflictException('Username is already in use.');
    }

    const newUser = this.userRepository.create({
      username,
      password,
    });
    await this.userRepository.save(newUser);
    const newUserWithoutPassword = { ...newUser };
    delete newUserWithoutPassword.password;

    return newUserWithoutPassword;
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    await this.userRepository.remove(user);
  }

  async getHashedPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await hash(password, saltRounds);
  }

  // async validateUser(payload: any): Promise<any> {
  //   const user = await this.getById(payload.sub);
  //   if (!user) {
  //     throw new UnauthorizedException();
  //   }

  //   return user;
  // }

  async getIsPasswordMatch(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await compare(plainPassword, hashedPassword);
  }
}
