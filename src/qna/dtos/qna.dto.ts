import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Qna } from '../entities/qna.entity';

@InputType()
export class QnaInput {
  @Field((type) => Int)
  qnaId: number;
}

@ObjectType()
export class QnaOutput extends CoreOutput {
  @Field((type) => Qna, { nullable: true })
  qna?: Qna;
}
