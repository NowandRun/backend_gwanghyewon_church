import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchBulletinBoard } from '../entities/churchBulletinBoard.entity';

@ObjectType()
export class FindChurchBulletinBoardOutput extends CoreOutput {
  @Field(() => ChurchBulletinBoard, { nullable: true })
  result?: ChurchBulletinBoard;
}
