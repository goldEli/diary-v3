import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateDiaryDto {
  @ApiProperty({ example: '记录了今天的心情与事件' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2025-09-29' })
  @IsDateString()
  journalDate: string;
}