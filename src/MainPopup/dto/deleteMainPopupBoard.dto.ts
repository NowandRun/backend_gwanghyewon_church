// boards/dto/delete-charchinformationboards.dto.ts
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray } from 'class-validator';

@InputType()
export class DeleteMainPopupBoardInput {
  @Field(() => [Int]) // Int 배열로 변경
  @IsArray()
  ids: number[];
}
