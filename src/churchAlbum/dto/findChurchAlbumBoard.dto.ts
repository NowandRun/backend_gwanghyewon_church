import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchAlbumBoard } from '../entities/churchAlbumBoard.entity';

@ObjectType()
export class FindChurchAlbumBoardOutput extends CoreOutput {
  @Field(() => ChurchAlbumBoard, { nullable: true })
  result?: ChurchAlbumBoard;
}
