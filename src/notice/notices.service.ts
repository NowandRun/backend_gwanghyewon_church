import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Notice } from './entities/notice.entity';
import {
  CreateNoticeInput,
  CreateNoticeOutput,
} from './dtos/create-notice.dto';
import { NoticesInput, NoticesOutput } from './dtos/notices.dto';
import { NoticeInput, NoticeOutput } from './dtos/notice.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly notices: Repository<Notice>,
    private readonly userService: UsersService,
  ) {}

  async createNotice(
    user: User,
    CreateNoticeInput: CreateNoticeInput,
  ): Promise<CreateNoticeOutput> {
    try {
      const newNotcie = this.notices.create(CreateNoticeInput);
      newNotcie.userId = user.id;
      newNotcie.userName = user.userName;

      await this.notices.save(newNotcie);

      return {
        ok: true,
        noticeId: newNotcie.id,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create Notice',
      };
    }
  }

  async allNotice({ page }: NoticesInput): Promise<NoticesOutput> {
    try {
      const [results, totalResults] = await this.notices.findAndCount({
        skip: (page - 1) * 30,
        take: 30,
        order: {
          createdAt: 'ASC',
        },
      });
      return {
        ok: true,
        results,
        totalPages: Math.ceil(totalResults / 30),
        totalResults,
      };
    } catch {
      return { ok: false, error: 'Could not load Notice' };
    }
  }

  async findNoticeById({ noticeId }: NoticeInput): Promise<NoticeOutput> {
    try {
      const notice = await this.notices.findOne({
        where: { id: noticeId },
        relations: ['qnaComment'],
      });

      if (!notice) {
        return {
          ok: false,
          error: 'Notice not found',
        };
      }
      const user = await this.userService.findById(notice.userId);
      if (user.user.id !== notice.userId) {
        notice.views += 1;
        await this.notices.save({ id: noticeId, views: notice.views });
      }

      return {
        ok: true,
        notice,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find Notice',
      };
    }
  }
}
