import { UsersService } from './users.service';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { LogoutInput, LogoutOutput } from './dtos/logout.dto';
import { Request } from 'express';
import { Inject, Res } from '@nestjs/common';
import { FindUserIdInput, FindUserIdOutput } from './dtos/find-user-id.dto';
import {
  UpdateUserPasswordInput,
  UpdateUserPasswordOutput,
} from './dtos/update-user-password.dto';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';

@Resolver((of) => User)
export class UsersResolver {
  constructor(
    private readonly userService: UsersService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  @Mutation((returns) => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.userService.createAccount(createAccountInput);
  }

  @Mutation((returns) => LoginOutput)
  login(
    @Args('input') loginInput: LoginInput,
    @Res({ passthrough: true }) req: Request,
  ): Promise<LoginOutput> {
    return this.userService.login(loginInput, req);
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

  @Mutation((returns) => LogoutOutput)
  @Role(['Any'])
  async logout(
    @AuthUser() authUser: User,
    @Args('input') logoutInput: LogoutInput,
    @Res({ passthrough: true }) req: Request,
  ): Promise<LogoutOutput> {
    return this.userService.logout(authUser, logoutInput, req);
  }

  @Mutation((returns) => Boolean)
  potatoReady() {
    pubsub.publish('hotPotatos', {
      readyPotatos: 'Your potato is ready. love you',
    });
    return true;
  }

  @Subscription((returns) => String)
  readyPotatos() {
    return pubsub.asyncIterator('hotPotatos');
  }
}
