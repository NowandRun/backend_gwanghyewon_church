import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ObjectType()
export class LogoutOutput extends CoreOutput {}

@InputType()
export class ForceLogoutInput {
  @Field(() => Number)
  userId: number;
}
