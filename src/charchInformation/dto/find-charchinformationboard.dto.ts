import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CharchInformationBoard } from '../entities/charchinformationboard.entity';

@ObjectType()
export class FindCharchInformationBoardOutput extends CoreOutput {
  @Field(() => CharchInformationBoard, { nullable: true })
  result?: CharchInformationBoard;
}
