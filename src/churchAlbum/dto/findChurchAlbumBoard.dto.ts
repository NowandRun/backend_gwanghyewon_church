import { Field, ObjectType } from '@nestjs/graphql';
import { ChurchAlbumBoard } from '../entities/churchAlbumBoard.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@ObjectType()
export class FindChurchAlbumBoardOutput extends CoreOutput {
  @Field(() => ChurchAlbumBoard, { nullable: true })
  result?: ChurchAlbumBoard;
}
