import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Qna } from '../entities/qna.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class QnasCommentsInput extends PaginationInput {}

@ObjectType()
export class QnasCommentsOutput extends PaginationOutput {
  @Field((type) => [Qna], { nullable: true })
  results?: Qna[];
}
