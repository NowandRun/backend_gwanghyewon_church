import { Field, InputType, PartialType, Int } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CreateMainPopupBoardDto } from './createMainPopupBoard.dto';

@InputType()
export class EditMainPopupBoardDto extends PartialType(
  CreateMainPopupBoardDto,
) {
  @Field(() => Int)
  @IsNumber() // 👈 class-validator가 이 필드를 허용하도록 명시
  id: number;
}
