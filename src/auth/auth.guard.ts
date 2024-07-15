import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AllowedRoles } from './role.decorator';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import * as cookieParser from 'cookie-parser';
import { CookieOptions } from 'express';
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

    const req = gqlContext.req;
    const res = gqlContext.res;

    cookieParser()(req, res, () => {});
    let accessToken = req.cookies['accessToken'];
    /* const accessToken = gqlContext.accessToken; */
    let refreshToken = req.cookies['refreshToken'];

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
          req.res.clearCookie('accessToken');
          req.res.clearCookie('refreshToken');
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
          req.res.clearCookie('accessToken');

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

            const accessTokenOptions: CookieOptions = {
              httpOnly: true,
              sameSite: 'none', // Client가 Server와 다른 IP(다른 도메인) 이더라도 동작하게 한다.
              secure: true, // sameSite:'none'을 할 경우 secure:true로 설정해준다.
            };

            const refreshTokenOptions: CookieOptions = {
              httpOnly: true,
              sameSite: 'none', // Client가 Server와 다른 IP(다른 도메인) 이더라도 동작하게 한다.
              secure: true, // sameSite:'none'을 할 경우 secure:true로 설정해준다.
            };

            req.res.cookie(
              'accessToken',
              updateAccessToken,
              accessTokenOptions,
            );
            req.res.cookie(
              'refreshToken',
              updateRefreshToken,
              refreshTokenOptions,
            );
            const newUser = await this.userService.updateRefreshToken(
              user,
              updateRefreshToken,
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
