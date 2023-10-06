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
import { HealthCheckController } from './healthcheck/healtcheck.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

const DatabaseModule = TypeOrmModule.forRootAsync({
  useFactory: async (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
  }),
  inject: [ConfigService],
});

const EntitiesModule = TypeOrmModule.forFeature([User, Todo]);

@Module({
  imports: [
    GlobalConfigModule,
    DatabaseModule,
    EntitiesModule,
    AuthModule,
    UserModule,
    TodoModule,
  ],
  controllers: [HealthCheckController, UserController, TodoController],
  providers: [UserService, TodoService],
})
export class AppModule {}
