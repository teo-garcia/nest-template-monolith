import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';

const PassportJWTModule = JwtModule.registerAsync({
  global: true,
  useFactory: (configService: ConfigService) => {
    return {
      secret: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: '1h' },
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [UserModule, PassportModule, PassportJWTModule],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
