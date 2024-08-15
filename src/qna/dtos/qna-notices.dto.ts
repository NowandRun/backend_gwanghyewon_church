import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

import { QnaNotice } from '../entities/qna-notice.entity';

@ObjectType()
export class QnasNoticeOutput extends CoreOutput {
  @Field(() => [QnaNotice], { nullable: true })
  results?: QnaNotice[];
}
