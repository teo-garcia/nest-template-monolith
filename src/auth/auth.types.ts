import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export interface JwtPayload {
  sub: string; // Subject (typically user ID)
  username: string; // User's username
  // email: string; // User's email (if needed)
  // Add any other relevant user information as needed
}

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4) // Minimum length for the username
  @MaxLength(20) // Maximum length for the username
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8) // Minimum length for the password
  @MaxLength(30) // Maximum length for the password
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
