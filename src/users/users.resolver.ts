import { UsersService } from './users.service';

import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql';

import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { LogoutInput, LogoutOutput } from './dtos/logout.dto';
import { Res } from '@nestjs/common';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Mutation((returns) => CreateAccountOutput)
  @Role(['Manager'])
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
}
