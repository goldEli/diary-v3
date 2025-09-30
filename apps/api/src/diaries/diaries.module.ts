import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from '../entities/diary.entity';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Diary])],
  providers: [DiariesService],
  controllers: [DiariesController],
})
export class DiariesModule {}