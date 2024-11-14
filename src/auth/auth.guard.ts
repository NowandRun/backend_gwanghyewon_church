import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();

    const refreshToken = gqlContext.req.cookies;

    if (refreshToken) {
      const { user } = gqlContext.res.locals;

      if (!user) {
        return false;
      }

      if (roles.includes('Any')) {
        return true;
      }
      return roles.includes(user.user['role']);
    } else {
      return false;
    }
  }
}
