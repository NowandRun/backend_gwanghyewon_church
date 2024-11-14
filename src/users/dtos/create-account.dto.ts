import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'userId',
  'password',
  'role',
  'userName',
  'address',
  'parish',
  'passwordCheakFindWord',
  'passwordCheakRole',
  'religious',
  'numberOfLoginAttempts',
  'email',
]) {
  @Field((type) => String)
  verifyPassword: string;

  @Field((type) => Boolean)
  consentToCollectPersonalData: boolean;

  @Field((type) => Boolean)
  outsourcingTheProcessingOfPersonalData: boolean;

  @Field((type) => Boolean)
  termsOfService: boolean;
}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
