import { Injectable, NestMiddleware } from '@nestjs/common';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';
import { CONTEXT, Context, GqlExecutionContext } from '@nestjs/graphql';
import * as cookieParser from 'cookie-parser';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('accessToken' in req.cookies && 'refreshToken' in req.cookies) {
      let accessToken = req.cookies['accessToken'];

      let refreshToken = req.cookies['refreshToken'];
      try {
        const accessTokenDecoded = await this.jwtService.accessTokenVerify(
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
        }

        if (
          typeof accessTokenDecoded === 'object' &&
          accessTokenDecoded.hasOwnProperty('id')
        ) {
          const user = await this.userService.findById(
            accessTokenDecoded['id'],
          );

          if (!user) {
            return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
          }

          req['user'] = user;
        }
      } catch (error) {
        try {
          try {
            const refreshTokenDecoded = this.jwtService.refreshTokenVerify(
              refreshToken.toString(),
            );

            if (
              !refreshTokenDecoded ||
              typeof refreshTokenDecoded !== 'object'
            ) {
              throw new Error('Invalid refresh token');
            }

            const user = await this.userService.findByRefreshToken(
              refreshToken + '',
            );

            if (!user) {
              return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
            }
            if (typeof refreshTokenDecoded === 'object') {
              const updateAccessToken = this.jwtService.signAccessToken(
                user.id,
              );
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
              res.cookie(
                'refreshToken',
                updateRefreshToken,
                refreshTokenOptions,
              );

              const newUser = await this.userService.updateRefreshToken(
                user,
                updateRefreshToken + '',
              );

              if (!newUser) {
                throw new Error('Failed to update refresh token');
              }
              req['user'] = newUser;
            }
          } catch (e) {
            console.error('Refresh token verification failed', error);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    next();
  }
}
