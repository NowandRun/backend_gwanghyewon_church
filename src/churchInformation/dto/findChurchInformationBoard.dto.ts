import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchInformationBoard } from '../entities/churchInformationBoard.entity';

@ObjectType()
export class FindChurchInformationBoardOutput extends CoreOutput {
  @Field(() => ChurchInformationBoard, { nullable: true })
  result?: ChurchInformationBoard;
}
