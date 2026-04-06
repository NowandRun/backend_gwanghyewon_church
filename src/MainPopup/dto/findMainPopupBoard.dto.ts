import { Field, ObjectType } from '@nestjs/graphql';
import { MainPopupBoard } from '../entities/MainPopupBoard.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@ObjectType()
export class FindMainPopupBoardOutput extends CoreOutput {
  @Field(() => MainPopupBoard, { nullable: true })
  result?: MainPopupBoard;
}
