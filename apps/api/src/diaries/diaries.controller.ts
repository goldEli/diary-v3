import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DiariesService } from './diaries.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { QueryDiaryDto } from './dto/query-diary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('diaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diaries')
export class DiariesController {
  constructor(private readonly diariesService: DiariesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Create diary successfully' })
  async create(@Req() req: any, @Body() dto: CreateDiaryDto) {
    const userId = req.user.userId;
    return this.diariesService.create(userId, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List diaries successfully' })
  async findAll(@Req() req: any, @Query() query: QueryDiaryDto) {
    const userId = req.user.userId;
    return this.diariesService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get diary detail successfully' })
  async findOne(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.diariesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOkResponse({ description: 'Update diary successfully' })
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiaryDto,
  ) {
    const userId = req.user.userId;
    return this.diariesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Delete diary successfully' })
  async remove(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.diariesService.remove(userId, id);
  }

  @Get('export/csv')
  @ApiOkResponse({ description: 'Export all diaries as CSV' })
  async exportCsv(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const csvBuffer = await this.diariesService.exportToCsv(userId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="diaries.csv"');
    res.send(csvBuffer);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ description: 'Import diaries from CSV' })
  async importCsv(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    return this.diariesService.importFromCsv(userId, file.buffer);
  }
}