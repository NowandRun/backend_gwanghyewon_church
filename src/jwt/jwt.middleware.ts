import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.headers['accessToken'];
    const refreshToken = req.cookies['ndr'];
    console.log(req.cookies);
    if (!refreshToken) {
      delete req.headers['access-token'];
      res.clearCookie('ndr');
      return next();
    }

    const user = await this.userService.findByRefreshToken(refreshToken + '');
    if (!user) {
      delete req.headers['access-token'];
      res.clearCookie('ndr');
      return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
    }

    if (!accessToken && refreshToken) {
      const revisitUpdateAccessToken = this.jwtService.signAccessToken(user.id);

      if (!revisitUpdateAccessToken) {
        return next();
      }

      const accessTokenDecoded = await this.jwtService.accessTokenVerify(
        revisitUpdateAccessToken.toString(),
      );

      const reVisitupdateUserInAccessToken = await this.userService.findById(
        accessTokenDecoded['id'],
      );

      if (!reVisitupdateUserInAccessToken) {
        res.clearCookie('ndr');
        return next();
      }

      res.locals.user = reVisitupdateUserInAccessToken;

      return next();
    }

    const refreshTokenDecoded = await this.jwtService.refreshTokenVerify(
      refreshToken.toString(),
    );

    if (!refreshTokenDecoded || typeof refreshTokenDecoded !== 'object') {
      delete req.headers['access-token'];
      res.clearCookie('ndr');
      return next();
    }

    if (accessToken && !refreshToken) {
      const accessTokenDecoded = this.jwtService.accessTokenVerify(
        accessToken.toString(),
      );
      await this.userService.logoutMiddleware(accessTokenDecoded['id']);
      delete req.headers['access-token'];
      res.clearCookie('ndr');
      return next();
    }

    if ('nda' in req.cookies && 'ndr' in req.cookies) {
      try {
        const accessTokenDecoded = await this.jwtService.accessTokenVerify(
          accessToken.toString(),
        );
        if (!accessTokenDecoded || !accessTokenDecoded.hasOwnProperty('id')) {
          /* throw new Error('Invalid access token'); */
          delete req.headers['access-token'];
          res.clearCookie('ndr');
          return next();
        }

        if (
          typeof accessTokenDecoded === 'object' &&
          accessTokenDecoded.hasOwnProperty('id')
        ) {
          const findUser = await this.userService.findById(
            accessTokenDecoded['id'],
          );

          if (!findUser) {
            return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
          }
          res.locals.user = findUser;

          return next();
        }
      } catch (error) {
        console.log(error);
        try {
          if (typeof refreshTokenDecoded === 'object') {
            const updateAccessToken = this.jwtService.signAccessToken(user.id);

            if (!updateAccessToken) {
              return next();
            }

            const accessTokenDecoded = await this.jwtService.accessTokenVerify(
              updateAccessToken.toString(),
            );

            const updateUserInAccessToken = await this.userService.findById(
              accessTokenDecoded['id'],
            );

            if (!updateUserInAccessToken) {
              return next();
            }

            this.jwtService.signAccessToken(updateUserInAccessToken.user.id);

            res.locals.user = updateUserInAccessToken;

            return next();
          }
        } catch (error) {}
      }
    }
    next();
  }
}
