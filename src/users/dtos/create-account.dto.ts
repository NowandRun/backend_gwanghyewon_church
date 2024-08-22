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
  'consentToCollectPersonalData',
  'outsourcingTheProcessingOfPersonalData',
  'parish',
  'passwordCheakFindWord',
  'passwordCheakRole',
  'religious',
  'termsOfService',
  'numberOfLoginAttempts',
  'email',
]) {
  @Field((type) => String)
  verifyPassword: string;
}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
