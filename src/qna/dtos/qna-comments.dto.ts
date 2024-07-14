import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Qna } from '../entities/qna.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class QnasInput extends PaginationInput {}

@ObjectType()
export class QnasOutput extends PaginationOutput {
  @Field((type) => [Qna], { nullable: true })
  results?: Qna[];
}
