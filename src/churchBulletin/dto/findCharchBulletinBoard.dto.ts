import { Field, ObjectType } from '@nestjs/graphql';
import { ChurchBulletinBoard } from '../entities/churchBulletinBoard.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@ObjectType()
export class FindChurchBulletinBoardOutput extends CoreOutput {
  @Field(() => ChurchBulletinBoard, { nullable: true })
  result?: ChurchBulletinBoard;
}
