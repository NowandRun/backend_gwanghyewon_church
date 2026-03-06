import { Field, InputType, PartialType, Float } from '@nestjs/graphql';
import { CreateCharchInformationBoardDto } from './create-charchinformationboard.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditCharchInformationBoardDto extends PartialType(
  CreateCharchInformationBoardDto,
) {
  @Field(() => Float)
  @IsNumber() // 👈 class-validator가 이 필드를 허용하도록 명시
  id: number;
}
