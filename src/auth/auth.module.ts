import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';

const JWTConfigModule = JwtModule.registerAsync({
  global: true,
  useFactory: (configService: ConfigService) => {
    return {
      secret: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: configService.get('JWT_EXPIRATION') },
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [UserModule, PassportModule, JWTConfigModule],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
