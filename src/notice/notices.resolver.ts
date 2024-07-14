import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Notice } from './entities/notice.entity';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { NoticeService } from './notices.service';
import {
  CreateNoticeInput,
  CreateNoticeOutput,
} from './dtos/create-notice.dto';
import { NoticesInput, NoticesOutput } from './dtos/notices.dto';
import { NoticeInput, NoticeOutput } from './dtos/notice.dto';
import { UsersService } from 'src/users/users.service';

@Resolver((of) => Notice)
export class NoticeResolver {
  constructor(private readonly noticeService: NoticeService) {}

  @Mutation((returns) => CreateNoticeOutput)
  /* @Role(['Manager']) */
  async createNotice(
    @AuthUser() authUser: User,
    @Args('input') createNoticeInput: CreateNoticeInput,
  ): Promise<CreateNoticeOutput> {
    return await this.noticeService.createNotice(authUser, createNoticeInput);
  }

  @Query((returns) => NoticesOutput)
  notices(@Args('input') noticesInput: NoticesInput): Promise<NoticesOutput> {
    return this.noticeService.allNotice(noticesInput);
  }

  @Query((returns) => NoticeOutput)
  qna(@Args('input') noticeInput: NoticeInput): Promise<NoticeOutput> {
    return this.noticeService.findNoticeById(noticeInput);
  }
}
