import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Qna } from './entities/qna.entity';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateQnaInput, CreateQnaOutput } from './dtos/create-qna.dto';
import { QnaService } from './qnas.service';
import { QnasInput, QnasOutput } from './dtos/qnas.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { QnaComment } from './entities/qna-comment.entity';
import {
  CreateQnaCommentInput,
  CreateQnaCommentOutput,
} from './dtos/create-qna-comment.dto';
import { QnaInput, QnaOutput } from './dtos/qna.dto';

@Resolver((of) => Qna)
export class QnaResolver {
  constructor(private readonly qnaService: QnaService) {}

  @Mutation((returns) => CreateQnaOutput)
  @Role(['Any'])
  async createQna(
    @AuthUser() authUser: User,
    @Args('input') createQnaInput: CreateQnaInput,
  ): Promise<CreateQnaOutput> {
    return await this.qnaService.createQna(authUser, createQnaInput);
  }

  @Query((returns) => QnasOutput)
  qnas(@Args('input') qnaInput: QnasInput): Promise<QnasOutput> {
    return this.qnaService.allQna(qnaInput);
  }

  @Query((returns) => QnaOutput)
  qna(@Args('input') qnaInput: QnaInput): Promise<QnaOutput> {
    return this.qnaService.findQnaById(qnaInput);
  }
}

@Resolver((of) => QnaComment)
export class QnaCommentResolver {
  constructor(private readonly qnaService: QnaService) {}

  @Mutation((returns) => CreateQnaCommentOutput)
  @Role(['Any'])
  async createQnaComment(
    @AuthUser() authUser: User,
    @Args('input') createQnaCommentInput: CreateQnaCommentInput,
  ): Promise<CreateQnaCommentOutput> {
    return this.qnaService.createQnaComment(authUser, createQnaCommentInput);
  }
}