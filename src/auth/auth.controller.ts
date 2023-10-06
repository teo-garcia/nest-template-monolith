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
    return {
      message: 'ok',
      data: await this.authService.signUp(signUpDto),
      status: HttpStatus['OK'],
    };
  }

  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: Response,
  ): Promise<StandardResponse> {
    const { jwt, user } = await this.authService.signIn(signInDto);

    res.header('Authorization', 'Bearer '.concat(jwt)).json(user);

    return {
      message: 'ok',
      status: HttpStatus['OK'],
    };
  }
}
