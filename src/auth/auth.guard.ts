import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AllowedRoles } from './role.decorator';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const accessToken = gqlContext.req.headers['access-jwt'];

    const refreshToken = gqlContext.req.headers['refresh-jwt'];
    if (accessToken && refreshToken) {
      try {
        const accessTokenDecoded = this.jwtService.accessTokenVerify(
          accessToken.toString(),
        );

        const checkRefreshToken = await this.userService.checkRefreshToken(
          accessTokenDecoded['id'],
        );
        /* refreshtoken이 db에 없을 시 header의 accessToken과 refreshToken을 지움 */
        if (!checkRefreshToken) {
          delete gqlContext.accessToken;
          delete gqlContext.refreshToken;
        }

        if (
          typeof accessTokenDecoded === 'object' &&
          accessTokenDecoded.hasOwnProperty('id')
        ) {
          const { user } = await this.userService.findById(
            accessTokenDecoded['id'],
          );

          if (!user) {
            return false;
          }

          gqlContext['user'] = user;
          if (roles.includes('Any')) {
            return true;
          }
          return roles.includes(user.role);
        }
      } catch (error) {
        try {
          delete gqlContext.accessToken;

          const refreshTokenDecoded = this.jwtService.refreshTokenVerify(
            refreshToken.toString(),
          );

          const user = await this.userService.findByRefreshToken(
            refreshToken + '',
          );

          if (!user) {
            return false;
          }
          if (typeof refreshTokenDecoded === 'object') {
            const updateAccessToken = this.jwtService.signAccessToken(user.id);
            const updateRefreshToken = this.jwtService.signRefreshToken();

            gqlContext.res.headers['access-jwt'] = updateAccessToken;
            gqlContext.res.headers['refresh-jwt'] = updateRefreshToken;

            gqlContext.accessToken = updateAccessToken; // updateAccessToken은 새로운 accessToken 값
            gqlContext.refreshToken = updateRefreshToken;

            const newUser = await this.userService.updateRefreshToken(
              user,
              gqlContext.refreshToken,
            );

            if (!newUser) {
              return false;
            }
            gqlContext['user'] = newUser;

            if (roles.includes('Any')) {
              return true;
            }
            return roles.includes(user.role);
          }
        } catch (e) {
          return false;
        }
      }
    } else {
      return false;
    }
  }
}
