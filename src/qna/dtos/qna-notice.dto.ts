import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { QnaNotice } from '../entities/qna-notice.entity';

@InputType()
export class QnaNoticeInput {
  @Field((type) => Int)
  qnaNoticeId: number;
}

@ObjectType()
export class QnaNoticeOutput extends CoreOutput {
  @Field((type) => QnaNotice, { nullable: true })
  qnaNotice?: QnaNotice;
}
