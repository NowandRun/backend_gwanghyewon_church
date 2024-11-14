import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const authorizationHeader = req.headers['authorization'];

    // authorizationHeader가 배열일 경우 첫 번째 요소를 사용
    let accessToken: string | null = null;

    // authorizationHeader가 존재하고 "Bearer "로 시작하는지 확인
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      // "Bearer "를 제거하고 토큰만 추출한 후, 공백을 제거합니다.
      accessToken = authorizationHeader.slice(7).trim();
    }
    const refreshToken = req.cookies['ndr'];

    if (!accessToken && !refreshToken) {
      return next();
    }

    if (!refreshToken) {
      delete req.headers['authorization'];
      return next();
    }

    const userId = await this.redis.get(`session:${refreshToken}`);

    if (!userId) {
      delete req.headers['authorization'];
      res.clearCookie('ndr');
      return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
    }

    if (!accessToken && refreshToken) {
      const revisitUpdateAccessToken = this.jwtService.signAccessToken(+userId);
      if (!revisitUpdateAccessToken) {
        return next();
      }

      const accessTokenDecoded = await this.jwtService.accessTokenVerify(
        revisitUpdateAccessToken,
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
    if (accessToken && !refreshToken) {
      delete req.headers['authorization'];
      res.clearCookie('ndr');
      return next();
    }

    try {
      const refreshTokenDecoded =
        await this.jwtService.refreshTokenVerify(refreshToken);

      if (accessToken && 'ndr' in req.cookies) {
        try {
          const accessTokenDecoded = await this.jwtService.accessTokenVerify(
            accessToken.toString(),
          );
          if (
            typeof accessTokenDecoded === 'object' &&
            accessTokenDecoded.hasOwnProperty('id')
          ) {
            const findUser = await this.userService.findById(
              accessTokenDecoded['id'],
            );

            if (!findUser) {
              delete req.headers['authorization'];
              res.clearCookie('ndr');
              return next(); // 유저를 찾을 수 없는 경우 미들웨어 종료
            }
            res.locals.user = findUser;

            return next();
          }
        } catch (error) {
          if (typeof refreshTokenDecoded === 'object') {
            const updateAccessToken = this.jwtService.signAccessToken(+userId);

            if (!updateAccessToken) {
              delete req.headers['authorization'];
              res.clearCookie('ndr');
              return next();
            }

            const accessTokenDecoded =
              await this.jwtService.accessTokenVerify(updateAccessToken);

            const updateUserInAccessToken = await this.userService.findById(
              accessTokenDecoded['id'],
            );

            if (!updateUserInAccessToken) {
              delete req.headers['authorization'];
              res.clearCookie('ndr');
              return next();
            }

            res.locals.user = updateUserInAccessToken;

            // 쿠키를 설정할 경우 (예: 쿠키에 토큰을 저장할 경우)
            // res.cookie('accessToken', updateAccessToken, { httpOnly: true, secure: true });

            // 응답 헤더에 새 액세스 토큰을 설정
            res.setHeader('Authorization', `Bearer ${updateAccessToken}`);

            return next();
          }
        }
      }
    } catch (error) {
      delete req.headers['authorization'];
      res.clearCookie('ndr');
      return next();
    }
  }
}
