import { Injectable, NestMiddleware } from '@nestjs/common';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    let accessToken = req.cookies['nda'];

    let refreshToken = req.cookies['ndr'];
    if (accessToken && !refreshToken) {
      const accessTokenDecoded = this.jwtService.accessTokenVerify(
        accessToken.toString(),
      );
      await this.userService.logoutMiddleware(accessTokenDecoded['id']);
      res.locals.user = '';
      res.clearCookie('nda');
      return next();
    }

    if (!refreshToken) {
      res.clearCookie('nda');
      res.clearCookie('ndr');
      return next();
    }

    const refreshTokenDecoded = await this.jwtService.refreshTokenVerify(
      refreshToken.toString(),
    );
    if (!refreshTokenDecoded || typeof refreshTokenDecoded !== 'object') {
      res.clearCookie('nda');
      res.clearCookie('ndr');
      return next();
    }

    if ('nda' in req.cookies && 'ndr' in req.cookies) {
      try {
        const accessTokenDecoded = await this.jwtService.accessTokenVerify(
          accessToken.toString(),
        );
        if (!accessTokenDecoded || !accessTokenDecoded.hasOwnProperty('id')) {
          throw new Error('Invalid access token');
        }

        if (!refreshToken) {
          await this.userService.logoutMiddleware(accessTokenDecoded['id']);
          res.clearCookie('nda');
          return next();
        }

        const checkRefreshToken = await this.userService.checkRefreshToken(
          accessTokenDecoded['id'],
        );

        if (!checkRefreshToken) {
          res.clearCookie('nda');
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
        try {
          if (typeof refreshTokenDecoded === 'object') {
            const user = await this.userService.findByRefreshToken(
              refreshToken + '',
            );

            if (!user) {
              return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
            }

            const updateAccessToken = this.jwtService.signAccessToken(user.id);

            if (!updateAccessToken) {
              return next();
            }

            const accessTokenOptions: CookieOptions = {
              httpOnly: this.configService.get<boolean>(
                'ACCESSTOKEN_HTTP_ONLY',
              ),
              sameSite: this.configService.get('ACCESSTOKEN_SAMESITE'),
              secure: this.configService.get<boolean>('ACCESSTOKEN_SECURE'),
              maxAge: this.configService.get<number>('ACCESSTOKEN_MAX_AGE'),
            };

            const accessTokenDecoded = await this.jwtService.accessTokenVerify(
              updateAccessToken.toString(),
            );

            const updateUserInAccessToken = await this.userService.findById(
              accessTokenDecoded['id'],
            );

            if (!updateUserInAccessToken) {
              return next();
            }

            res.cookie('nda', updateAccessToken, accessTokenOptions);
            res.locals.user = updateUserInAccessToken;

            return next();
          }
        } catch (error) {}
      }
    }
    next();
  }
}
