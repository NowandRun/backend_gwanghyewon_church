import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { MainPopupBoard } from '../entities/MainPopupBoard.entity';

@ObjectType()
export class FindMainPopupBoardOutput extends CoreOutput {
  @Field(() => MainPopupBoard, { nullable: true })
  result?: MainPopupBoard;
}
