import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.interface';

import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.getByEmail(email);

    if (user) {
      const isPasswordMatching = await bcrypt.compare(password, user.password);

      if (isPasswordMatching) {
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async signIn(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload);
  }
}
