import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export interface JwtPayload {
  sub: string;
  username: string;
}

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  password: string;
}

export class SignInDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
