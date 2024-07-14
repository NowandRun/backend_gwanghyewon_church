import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Notice } from '../entities/notice.entity';

@InputType()
export class NoticeInput {
  @Field((type) => Int)
  noticeId: number;
}

@ObjectType()
export class NoticeOutput extends CoreOutput {
  @Field((type) => Notice, { nullable: true })
  notice?: Notice;
}
