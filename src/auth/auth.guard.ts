import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { CookieOptions } from 'express';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const { req, res } = gqlContext;

    console.log(req.cookies);
    let accessToken = req.cookies['accessToken'];
    let refreshToken = req.cookies['refreshToken'];
    if (accessToken && refreshToken) {
      try {
        const accessTokenDecoded = this.jwtService.accessTokenVerify(
          accessToken.toString(),
        );

        if (!accessTokenDecoded || !accessTokenDecoded.hasOwnProperty('id')) {
          throw new Error('Invalid access token');
        }

        const checkRefreshToken = await this.userService.checkRefreshToken(
          accessTokenDecoded['id'],
        );

        if (!checkRefreshToken) {
          res.clearCookie('accessToken');
          res.clearCookie('refreshToken');
          return false;
        }

        if (
          typeof accessTokenDecoded === 'object' &&
          accessTokenDecoded.hasOwnProperty('id')
        ) {
          const user = await this.userService.findById(
            accessTokenDecoded['id'],
          );
          if (!user) {
            return false;
          }

          gqlContext['user'] = user;

          return roles.includes('Any') || roles.includes(user.user.role);
        }
      } catch (error) {
        {
          const refreshTokenDecoded = this.jwtService.refreshTokenVerify(
            refreshToken.toString(),
          );

          if (!refreshTokenDecoded || typeof refreshTokenDecoded !== 'object') {
            throw new Error('Invalid refresh token');
          }

          const user = await this.userService.findByRefreshToken(
            refreshToken + '',
          );
          console.log(user);
          if (!user) {
            return false;
          }

          if (typeof refreshTokenDecoded === 'object') {
            const updateAccessToken = this.jwtService.signAccessToken(user.id);
            const updateRefreshToken = this.jwtService.signRefreshToken();
            const accessTokenOptions: CookieOptions = {
              httpOnly: true,
              sameSite: 'none',
              secure: true,
            };

            const refreshTokenOptions: CookieOptions = {
              httpOnly: true,
              sameSite: 'none',
              secure: true,
            };
            res.cookie('accessToken', updateAccessToken, accessTokenOptions);
            res.cookie('refreshToken', updateRefreshToken, refreshTokenOptions);
            const newUser = await this.userService.updateRefreshToken(
              user,
              updateRefreshToken + '',
            );
            if (!newUser) {
              throw new Error('Failed to update refresh token');
            }
            req['user'] = newUser;
          }
        }
      }
    }
  }
}
