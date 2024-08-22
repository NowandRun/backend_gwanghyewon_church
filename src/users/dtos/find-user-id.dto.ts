import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class FindUserIdInput extends PickType(User, ['email', 'userName']) {}

@ObjectType()
export class FindUserIdOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  userId?: string;
}
