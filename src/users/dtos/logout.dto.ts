import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class LogoutOutput extends CoreOutput {}

@InputType()
export class ForceLogoutInput {
  @Field(() => Number)
  userId: number;
}
