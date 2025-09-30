import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as csvWriter from 'csv-writer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { Diary } from '../entities/diary.entity';

interface CreateDiaryInput {
  title: string;
  content: string;
  journalDate: string;
  mood?: string | null;
}

interface UpdateDiaryInput {
  title?: string;
  content?: string;
  journalDate?: string;
  mood?: string | null;
}

interface QueryDiaryInput {
  page?: number;
  limit?: number;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class DiariesService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepo: Repository<Diary>,
  ) {}

  async create(userId: number, input: CreateDiaryInput) {
    const diary = this.diaryRepo.create({
      title: input.title,
      content: input.content,
      journalDate: input.journalDate,
      mood: input.mood ?? undefined,
      user: { id: userId } as any,
    } as Partial<Diary>);
    const saved = await this.diaryRepo.save(diary as Diary);
    return { id: saved.id };
  }

  async findAll(userId: number, query: QueryDiaryInput) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const qb = this.diaryRepo
      .createQueryBuilder('d')
      .where('d.userId = :userId', { userId })
      .orderBy('d.journalDate', 'DESC')
      .addOrderBy('d.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    if (query.keyword) {
      qb.andWhere('(d.title LIKE :kw OR d.content LIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    if (query.fromDate) {
      qb.andWhere('d.journalDate >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }
    if (query.toDate) {
      qb.andWhere('d.journalDate <= :toDate', {
        toDate: new Date(query.toDate),
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(userId: number, id: number) {
    const diary = await this.diaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!diary) throw new NotFoundException('Diary not found');
    return diary;
  }

  async update(userId: number, id: number, input: UpdateDiaryInput) {
    const diary = await this.diaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!diary) throw new NotFoundException('Diary not found');
    if (input.title !== undefined) diary.title = input.title;
    if (input.content !== undefined) diary.content = input.content;
    if (input.journalDate !== undefined)
      diary.journalDate = input.journalDate;
    if (input.mood !== undefined) diary.mood = input.mood ?? undefined;
    await this.diaryRepo.save(diary);
    return { id: diary.id };
  }

  async remove(userId: number, id: number) {
    const diary = await this.diaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!diary) throw new NotFoundException('Diary not found');
    await this.diaryRepo.remove(diary);
    return { id };
  }

  async exportToCsv(userId: number): Promise<Buffer> {
    const diaries = await this.diaryRepo.find({
      where: { user: { id: userId } },
      order: { journalDate: 'DESC' },
    });

    const records = diaries.map(diary => ({
      id: diary.id,
      title: diary.title,
      content: diary.content,
      journalDate: diary.journalDate,
      mood: diary.mood || '',
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
    }));

    const writer = csvWriter.createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: '标题' },
        { id: 'content', title: '内容' },
        { id: 'journalDate', title: '日记日期' },
        { id: 'mood', title: '心情' },
        { id: 'createdAt', title: '创建时间' },
        { id: 'updatedAt', title: '更新时间' },
      ],
    });

    const csvString = writer.getHeaderString() + writer.stringifyRecords(records);
    return Buffer.from(csvString, 'utf8');
  }

  async importFromCsv(userId: number, csvBuffer: Buffer): Promise<{ imported: number; errors: string[] }> {
    const csvString = csvBuffer.toString('utf8');
    const results: any[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from([csvString]);
      
      stream
        .pipe(csvParser())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          let imported = 0;
          
          for (const row of results) {
            try {
              // 验证必需字段
              if (!row['标题'] || !row['内容'] || !row['日记日期']) {
                errors.push(`行 ${results.indexOf(row) + 2}: 缺少必需字段（标题、内容、日记日期）`);
                continue;
              }

              // 检查日期格式
              const journalDate = row['日记日期'];
              if (!/^\d{4}-\d{2}-\d{2}$/.test(journalDate)) {
                errors.push(`行 ${results.indexOf(row) + 2}: 日期格式错误，应为 YYYY-MM-DD`);
                continue;
              }

              // 创建日记
              await this.create(userId, {
                title: row['标题'],
                content: row['内容'],
                journalDate: journalDate,
                mood: row['心情'] || null,
              });
              
              imported++;
            } catch (error: any) {
              errors.push(`行 ${results.indexOf(row) + 2}: ${error.message}`);
            }
          }
          
          resolve({ imported, errors });
        })
        .on('error', (error: any) => {
          reject(error);
        });
    });
  }
}