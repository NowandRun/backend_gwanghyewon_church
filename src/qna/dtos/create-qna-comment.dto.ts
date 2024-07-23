import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { QnaComment } from '../entities/qna-comment.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateQnaCommentInput extends PickType(QnaComment, ['comment']) {
  @Field((type) => Int)
  qnaId: number;
}

@ObjectType()
export class CreateQnaCommentOutput extends CoreOutput {
  @Field((type) => [QnaComment], { nullable: true })
  results?: QnaComment[];
}
