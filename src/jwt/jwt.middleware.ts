import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';
import { CONTEXT, Context, GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('access-jwt' in req.headers && 'refresh-jwt' in req.headers) {
      let accessToken = req.headers['access-jwt'];
      let refreshToken = req.headers['refresh-jwt'];
      try {
        const accessTokenDecoded = this.jwtService.accessTokenVerify(
          accessToken.toString(),
        );
        const checkRefreshToken = await this.userService.checkRefreshToken(
          accessTokenDecoded['id'],
        );

        /* refreshtoken이 db에 없을 시 header의 accessToken과 refreshToken을 지움 */
        if (!checkRefreshToken) {
          delete req.headers['access-jwt'];
          delete req.headers['refresh-jwt'];
        }

        if (
          typeof accessTokenDecoded === 'object' &&
          accessTokenDecoded.hasOwnProperty('id')
        ) {
          const user = await this.userService.findById(
            accessTokenDecoded['id'],
          );
          req['user'] = user;
        }
      } catch (error) {
        try {
          const refreshTokenDecoded = this.jwtService.refreshTokenVerify(
            refreshToken.toString(),
          );
          const user = await this.userService.findByRefreshToken(
            refreshToken + '',
          );

          if (!user) {
            return {
              ok: false,
              error: "This account doesn't exist. ",
            };
          }
          if (typeof refreshTokenDecoded === 'object') {
            const updateAccessToken = this.jwtService.signAccessToken(user.id);
            const updateRefreshToken = this.jwtService.signRefreshToken();

            // req.headers token update
            accessToken = updateAccessToken;
            refreshToken = updateRefreshToken;
            req.headers['access-jwt'] = updateAccessToken;
            req.headers['refresh-jwt'] = updateRefreshToken;

            console.log(accessToken === updateAccessToken);
            console.log(refreshToken === updateRefreshToken);

            const newUser = await this.userService.updateRefreshToken(
              user,
              updateRefreshToken + '',
            );

            if (!newUser) {
              throw new Error('Failed to update refresh token');
            }

            req['user'] = newUser;

            console.log(
              "인증 req.headers['access-jwt'] =>",
              req.headers['access-jwt'],
            );

            console.log(
              "인증 req.headers['refresh-jwt'] =>",
              req.headers['refresh-jwt'],
            );
          }
        } catch (e) {
          console.error('Refresh token verification failed', error);
        }
      }
    }
    next();
  }
}
