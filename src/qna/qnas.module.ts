import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qna } from './entities/qna.entity';
import { QnaService } from './qnas.service';
import {
  QnaCommentResolver,
  QnaNoticeResolver,
  QnaResolver,
} from './qnas.resolver';
import { QnaComment } from './entities/qna-comment.entity';
import { UsersModule } from 'src/users/users.module';
import { QnaNotice } from './entities/qna-notice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Qna, QnaComment, QnaNotice]),
    UsersModule,
  ],
  providers: [QnaResolver, QnaCommentResolver, QnaNoticeResolver, QnaService],
})
export class QnaModule {}
