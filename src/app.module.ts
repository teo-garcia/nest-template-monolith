import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TodoController } from './todo/todo.controller';
import { UserController } from './user/user.controller';
import { User } from './user/user.entity';
import { Todo } from './todo/todo.entity';
import { UserService } from './user/user.service';
import { TodoService } from './todo/todo.service';
import { JwtService } from '@nestjs/jwt';
import { HealthCheckController } from './healthcheck/healtcheck.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

const InitDBModule = TypeOrmModule.forRootAsync({
  // imports: [
  //   ConfigModule.forRoot({
  //     isGlobal: true,
  //     envFilePath: '.env',
  //   }),
  // ],
  useFactory: async (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true, // Should be set to false in production
  }),
  inject: [ConfigService],
});

const EntititesDBModule = TypeOrmModule.forFeature([User, Todo]);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InitDBModule,
    EntititesDBModule,
    AuthModule,
    UserModule,
    TodoModule,
  ],
  controllers: [HealthCheckController, UserController, TodoController],
  providers: [JwtService, UserService, TodoService],
})
export class AppModule {}
