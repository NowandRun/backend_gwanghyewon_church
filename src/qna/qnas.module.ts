import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qna } from './entities/qna.entity';
import { QnaService } from './qnas.service';
import { QnaCommentResolver, QnaResolver } from './qnas.resolver';
import { QnaComment } from './entities/qna-comment.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Qna, QnaComment]), UsersModule],
  providers: [QnaResolver, QnaCommentResolver, QnaService],
})
export class QnaModule {}
