import { Field, ObjectType } from '@nestjs/graphql';
import { ChurchInformationBoard } from '../entities/churchInformationBoard.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@ObjectType()
export class FindChurchInformationBoardOutput extends CoreOutput {
  @Field(() => ChurchInformationBoard, { nullable: true })
  result?: ChurchInformationBoard;
}
