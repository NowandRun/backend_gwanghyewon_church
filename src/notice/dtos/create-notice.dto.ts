import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Notice } from '../entities/notice.entity';

@InputType()
export class CreateNoticeInput extends PickType(Notice, [
  'description',
  'title',
]) {}

@ObjectType()
export class CreateNoticeOutput extends CoreOutput {
  @Field((type) => Int)
  noticeId?: number;
}
