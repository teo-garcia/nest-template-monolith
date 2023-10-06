import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtPayload, SignInDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(payload: any): Promise<any> {
    const user = await this.userService.getById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async signIn(signInDto: SignInDto): Promise<{ user: User; jwt: string }> {
    const { username, password } = signInDto;

    const user = await this.userService.getByUsername(username);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    delete user.password;

    const jwtPayload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
    };

    const jwt = this.jwtService.sign(jwtPayload);

    return { user, jwt };
  }

  async signUp(signUpDto: SignInDto): Promise<User> {
    const newUser = await this.userService.add(signUpDto);
    return newUser;
  }
}
