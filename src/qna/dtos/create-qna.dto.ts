import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Qna } from '../entities/qna.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateQnaInput extends PickType(Qna, ['description', 'title']) {}

@ObjectType()
export class CreateQnaOutput extends CoreOutput {
  @Field((type) => Qna, { nullable: true })
  results?: Qna;
}
