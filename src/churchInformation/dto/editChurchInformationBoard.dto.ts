import { Field, InputType, PartialType, Int } from '@nestjs/graphql';
import { CreateChurchInformationBoardDto } from './createChurchInformationBoard.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditChurchInformationBoardDto extends PartialType(
  CreateChurchInformationBoardDto,
) {
  @Field(() => Int)
  @IsNumber() // 👈 class-validator가 이 필드를 허용하도록 명시
  id: number;
}
