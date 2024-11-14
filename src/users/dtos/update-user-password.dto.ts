import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { PasswordCheakRole, User } from '../entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateUserPasswordInput extends PickType(User, [
  'userId',
  'password',
]) {
  @Field((type) => String)
  verifyUpdatePassword: string;

  @Field((type) => PasswordCheakRole)
  selectFindUserQuestion: PasswordCheakRole;

  @Field((type) => String)
  verifyQuestionAnswer: string;
}

@ObjectType()
export class UpdateUserPasswordOutput extends CoreOutput {}
