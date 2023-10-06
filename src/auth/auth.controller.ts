import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { SignUpDto, SignInDto } from './auth.types';
import { User } from 'src/user/user.entity';
import { AuthService } from './auth.service';
import { Response } from 'express';
import type { StandardResponse } from 'src/misc.types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<StandardResponse<User>> {
    const user = await this.authService.signUp(signUpDto);
    return {
      message: 'User registered successfully',
      data: user,
      status: HttpStatus.CREATED,
    };
  }

  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: Response,
  ): Promise<void> {
    const { jwt, user } = await this.authService.signIn(signInDto);
    res.header('Authorization', `Bearer ${jwt}`).json(user);
  }
}
