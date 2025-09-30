import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiaryDto {
  @ApiProperty({ example: '今天的记录' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '记录了今天的心情与事件' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2025-09-29' })
  @IsDateString()
  journalDate: string;

  @ApiProperty({ example: 'happy', required: false })
  @IsString()
  @IsOptional()
  mood?: string;
}