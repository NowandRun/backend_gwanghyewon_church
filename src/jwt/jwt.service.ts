import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}

  // Access token 생성
  signAccessToken(id: number): string {
    return jwt.sign({ id }, this.options.accessTokenPrivateKey, {
      expiresIn: this.options.accessTokenExpiresIn,
    });
  }

  // Refresh token 생성 (userId를 payload에 포함하지 않음)
  signRefreshToken(): string {
    return jwt.sign({}, this.options.refreshTokenPrivateKey, {
      expiresIn: this.options.refreshTokenExpiresIn,
    });
  }

  /// 토큰 검증
  accessTokenVerify(accessToken: string): any {
    try {
      const accessPayload = jwt.verify(
        accessToken,
        this.options.accessTokenPrivateKey,
      );
      return accessPayload; // 유효한 경우에만 payload 반환
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('AccessToken Expired.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Not a valid AccessToken.');
      } else {
        throw new Error('AccessToken verification failed.');
      }
    }
  }

  refreshTokenVerify(refreshToken: string): any {
    try {
      const refreshPayload = jwt.verify(
        refreshToken,
        this.options.refreshTokenPrivateKey,
      );

      return refreshPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('RefreshToken Expired.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Not a valid RefreshToken.');
      } else {
        throw new Error('RefreshToken verification failed.');
      }
    }
  }
}
