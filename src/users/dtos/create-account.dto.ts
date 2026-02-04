import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User, UserRole } from '../entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'userId',
  'password',
  'nickname',
  'userName',
  'address',
  'parish',
  'religious',
  'passwordCheakFindWord',
  'passwordCheakRole',
]) {
  @Field(() => String)
  verifyPassword: string;

  @Field(() => Boolean)
  termsOfService: boolean;

  @Field(() => Boolean)
  consentToCollectPersonalData: boolean;

  @Field(() => Boolean)
  outsourcingTheProcessingOfPersonalData: boolean;
}

@InputType()
export class CreateAdminInput extends PickType(User, [
  'userId',
  'password',
  'nickname',
  'userName',
]) {
  @Field(() => UserRole)
  role: UserRole;
}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
