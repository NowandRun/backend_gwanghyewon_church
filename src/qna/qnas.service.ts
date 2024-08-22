import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Qna } from './entities/qna.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateQnaInput, CreateQnaOutput } from './dtos/create-qna.dto';
import { QnasInput, QnasOutput } from './dtos/qnas.dto';
import { CreateQnaCommentInput } from './dtos/create-qna-comment.dto';
import { QnaComment } from './entities/qna-comment.entity';
import { QnaInput, QnaOutput } from './dtos/qna.dto';
import { UsersService } from 'src/users/users.service';
import { QnaNotice } from './entities/qna-notice.entity';
import { QnasNoticeOutput } from './dtos/qna-notices.dto';
import { QnaNoticeInput, QnaNoticeOutput } from './dtos/qna-notice.dto';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(Qna)
    private readonly qnas: Repository<Qna>,
    @InjectRepository(QnaComment)
    private readonly qnaComments: Repository<QnaComment>,
    @InjectRepository(QnaNotice)
    private readonly qnaNotices: Repository<QnaNotice>,
    private readonly userService: UsersService,
  ) {}

  async createQna(
    user: User,
    { description, title }: CreateQnaInput,
  ): Promise<CreateQnaOutput> {
    try {
      if (user.role === UserRole.Client) {
        const qna = new Qna();
        qna.userId = user.id;
        qna.userName = this.maskUserName(user.userName);
        qna.title = title;
        qna.description = description;

        const newQna = await this.qnas.save(this.qnas.create(qna));

        return {
          ok: true,
          qnaId: newQna.id,
        };
      }

      if (user.role === UserRole.Admin) {
        const qnaNotices = await this.allNoticeQna();
        if (qnaNotices.results.length >= 6) {
          return {
            ok: false,
            error: '더 이상 공지 게시물을 작성할 수 없습니다.',
          };
        }
        const qnaNotice = new QnaNotice();
        qnaNotice.userId = user.id;
        qnaNotice.userName = user.userName;
        qnaNotice.title = title;
        qnaNotice.description = description;
        const newQnaNotice = await this.qnaNotices.save(
          this.qnaNotices.create(qnaNotice),
        );
        return {
          ok: true,
          qnaId: newQnaNotice.id,
        };
      }
    } catch {
      return {
        ok: false,
        error: 'Could not create qna',
      };
    }
  }

  async allClientQna({ page }: QnasInput): Promise<QnasOutput> {
    try {
      const [results, totalResults] = await this.qnas.findAndCount({
        skip: (page - 1) * 30,
        take: 30,
        order: {
          createdAt: 'DESC',
        },
      });
      return {
        ok: true,
        results,
        totalPages: Math.ceil(totalResults / 30),
        totalResults,
      };
    } catch {
      return { ok: false, error: 'Could not load qna' };
    }
  }

  async allNoticeQna(): Promise<QnasNoticeOutput> {
    try {
      const qnaNoticeResults = await this.qnaNotices.find({
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        ok: true,
        results: qnaNoticeResults,
      };
    } catch {
      return { ok: false, error: 'Could not load qna notice' };
    }
  }

  async createQnaComment(
    user: User,
    createQnaCommentInput: CreateQnaCommentInput,
  ): Promise<CreateQnaOutput> {
    try {
      const qna = await this.qnas.findOne({
        where: { id: createQnaCommentInput.qnaId },
      });
      if (!qna) {
        return {
          ok: false,
          error: 'qna not found',
        };
      }
      if (user.id !== qna.userId) {
        return {
          ok: false,
          error: "You can't dot that.",
        };
      }
      // QnaComment 엔티티 생성 및 저장
      const qnaComment = new QnaComment();
      qnaComment.userId = user.id;
      if (user.role === UserRole.Admin) {
        qnaComment.commentOwner = user.userName;
      }
      qnaComment.commentOwner = this.maskUserName(user.userName);
      qnaComment.comment = createQnaCommentInput.comment;
      qnaComment.qna = qna;

      const savedQnaComment = await this.qnaComments.save(qnaComment);
      console.log(savedQnaComment);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create qna comment',
      };
    }
  }

  async findQnaClientById({ qnaId }: QnaInput): Promise<QnaOutput> {
    try {
      const qna = await this.qnas.findOne({
        where: { id: qnaId },
        relations: ['qnaComment'],
      });

      if (!qna) {
        return {
          ok: false,
          error: 'Qna not found',
        };
      }

      const user = await this.userService.findById(qna.userId);

      if (user.user.id !== qna.userId) {
        qna.views += 1;
        await this.qnas.save({ id: qnaId, views: qna.views });
      }

      return {
        ok: true,
        qna,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find Qna',
      };
    }
  }

  async findQnaNoticeById({
    qnaNoticeId,
  }: QnaNoticeInput): Promise<QnaNoticeOutput> {
    try {
      const qnaNotice = await this.qnaNotices.findOne({
        where: { id: qnaNoticeId },
      });

      if (!qnaNotice) {
        return {
          ok: false,
          error: 'Qna notice not found',
        };
      }

      const user = await this.userService.findById(qnaNotice.userId);

      if (user.user.id !== qnaNotice.userId) {
        qnaNotice.views += 1;
        await this.qnaNotices.save({ id: qnaNoticeId, views: qnaNotice.views });
      }

      return {
        ok: true,
        qnaNotice,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find Qna notice',
      };
    }
  }

  // 사용자 이름 마스킹 함수 (정규표현식 활용)
  private maskUserName(userName: string): string {
    return userName.replace(/\b(\w+)\b/g, (match, word) => {
      // 정규표현식으로 공백을 기준으로 단어를 구분하여 마스킹 처리
      if (word.length > 1) {
        return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
      } else {
        return word; // 한 글자는 그대로 반환
      }
    });
  }
}
