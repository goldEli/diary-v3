import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}