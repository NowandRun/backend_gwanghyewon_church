import { Field, InputType, PartialType, Int } from '@nestjs/graphql';
import { CreateChurchAlbumBoardDto } from './createChurchAlbumBoard.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditChurchAlbumBoardDto extends PartialType(
  CreateChurchAlbumBoardDto,
) {
  @Field(() => Int)
  @IsNumber() // 👈 class-validator가 이 필드를 허용하도록 명시
  id: number;
}
