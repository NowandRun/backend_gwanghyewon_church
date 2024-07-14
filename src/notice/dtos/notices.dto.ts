import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Notice } from '../entities/notice.entity';

@InputType()
export class NoticesInput extends PaginationInput {}

@ObjectType()
export class NoticesOutput extends PaginationOutput {
  @Field((type) => [Notice], { nullable: true })
  results?: Notice[];
}
