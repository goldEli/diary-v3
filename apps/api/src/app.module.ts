import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DiariesModule } from './diaries/diaries.module';
import { Diary } from './entities/diary.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USER', 'diary_user'),
        password: config.get<string>('DB_PASSWORD', 'diary_pass'),
        database: config.get<string>('DB_NAME', 'diary'),
        entities: [User, Diary],
        synchronize: true,
        timezone: 'Z',
      }),
    }),
    UsersModule,
    AuthModule,
    DiariesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
