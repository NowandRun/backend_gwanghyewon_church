import { Field, InputType, PartialType, Int } from '@nestjs/graphql';
import { CreateChurchBulletinBoardDto } from './createCharchAlbumBoard.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditChurchBulletinBoardDto extends PartialType(
  CreateChurchBulletinBoardDto,
) {
  @Field(() => Int)
  @IsNumber() // 👈 class-validator가 이 필드를 허용하도록 명시
  id: number;
}
