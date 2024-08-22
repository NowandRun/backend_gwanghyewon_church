import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateUserPasswordInput extends PickType(User, [
  'userId',
  'password',
]) {
  @Field((type) => String)
  verifyUpdatePassword: string;
}

@ObjectType()
export class UpdateUserPasswordOutput extends CoreOutput {}
