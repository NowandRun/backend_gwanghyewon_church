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
  signAccessToken(userId: number): string {
    return jwt.sign({ id: userId }, this.options.accessTokenPrivateKey, {
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
    const accessPayload = jwt.verify(
      accessToken,
      this.options.accessTokenPrivateKey,
    );

    return accessPayload;
  }

  refreshTokenVerify(refreshToken: string): any {
    try {
      const refreshPayload = jwt.verify(
        refreshToken,
        this.options.refreshTokenPrivateKey,
      );

      return refreshPayload;
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }
}
