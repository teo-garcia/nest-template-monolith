import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { JwtPayload, SignInDto, SignUpDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    const { username } = signUpDto;

    const existingUser = await this.userService.getByUsername(username);

    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    const newUser = await this.userService.add(signUpDto);

    return newUser;
  }

  async signIn(signInDto: SignInDto): Promise<{ user: User; jwt: string }> {
    const { username, password } = signInDto;

    const user = await this.userService.getByUsername(username);
    const isPasswordMatch = await this.userService.getIsPasswordMatch(
      password,
      user.password,
    );

    if (!isPasswordMatch) {
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
}
