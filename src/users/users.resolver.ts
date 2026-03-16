import { UsersService } from './users.service';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
  CreateAdminInput,
} from './dtos/create-account.dto';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { LogoutOutput } from './dtos/logout.dto';
import { Inject } from '@nestjs/common';
import { FindUserIdInput, FindUserIdOutput } from './dtos/find-user-id.dto';
import {
  UpdateUserPasswordInput,
  UpdateUserPasswordOutput,
} from './dtos/update-user-password.dto';
import {
  NEW_DELETE_ACCOUNT_MESSAGE,
  PUB_SUB,
} from 'src/common/common.constants';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Resolver((of) => User)
export class UsersResolver {
  constructor(
    private readonly userService: UsersService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  @Mutation((returns) => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.userService.createAccount(createAccountInput);
  }

  /* @UseGuards(RolesAuthGuard) */
  @Role(['SuperAdmin']) // 사용자에 따른 접근 제어
  @Mutation(() => CreateAccountOutput)
  createAdmin(
    @AuthUser() superAdmin: User,
    @Args('input') createAdminInput: CreateAdminInput,
  ): Promise<CreateAccountOutput> {
    return this.userService.createAdminAccount(superAdmin, createAdminInput);
  }

  @Mutation((returns) => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.userService.login(loginInput);
  }

  @Query((returns) => FindUserIdOutput)
  findByUserId(
    @Args('input') findUserIdInput: FindUserIdInput,
  ): Promise<FindUserIdOutput> {
    return this.userService.findByUserId(findUserIdInput);
  }

  @Mutation((returns) => UpdateUserPasswordOutput)
  updateByUserPassword(
    @Args('input') updateUserPasswordInput: UpdateUserPasswordInput,
  ): Promise<UpdateUserPasswordOutput> {
    return this.userService.updateByUserPassword(updateUserPasswordInput);
  }

  @Query((returns) => User)
  @Role(['Any'])
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query((returns) => UserProfileOutput)
  @Role(['Any'])
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.userService.findById(userProfileInput.userId);
  }

  @Mutation(() => LogoutOutput)
  logout() {
    return {
      ok: true,
    };
  }

  @Subscription((returns) => User)
  sendingDeleteAccountMessage() {
    return this.pubSub.asyncIterator(NEW_DELETE_ACCOUNT_MESSAGE);
  }
}
