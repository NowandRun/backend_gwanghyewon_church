import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class FindUserIdInput extends PickType(User, [
  /* 'email', */ 'userName',
]) {}

@ObjectType()
export class FindUserIdOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  userId?: string;
}
