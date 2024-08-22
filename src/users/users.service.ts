import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { PasswordCheakRole, User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { LogoutInput, LogoutOutput } from './dtos/logout.dto';
import { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FindUserIdInput, FindUserIdOutput } from './dtos/find-user-id.dto';
import {
  UpdateUserPasswordInput,
  UpdateUserPasswordOutput,
} from './dtos/update-user-password.dto';
import { Cron } from '@nestjs/schedule';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async createAccount({
    userId,
    userName,
    password,
    role,
    consentToCollectPersonalData,
    outsourcingTheProcessingOfPersonalData,
    passwordCheakFindWord,
    passwordCheakRole,
    termsOfService,
    address,
    parish,
    religious,
    verifyPassword,
    email,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      await this.canMakeAccount(
        userId,
        userName,
        password,
        consentToCollectPersonalData,
        outsourcingTheProcessingOfPersonalData,
        passwordCheakFindWord,
        passwordCheakRole,
        termsOfService,
        verifyPassword,
        email,
      );

      const userdata = this.users.create({
        userId,
        password,
        role,
        userName,
        address,
        consentToCollectPersonalData,
        outsourcingTheProcessingOfPersonalData,
        parish,
        passwordCheakFindWord,
        passwordCheakRole,
        religious,
        termsOfService,
        email,
      });

      await this.users.save(userdata);

      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: '계정생성에 실패하였습니다. 관리자에게 문의하세요.',
      };
    }
  }

  async login({ userId, password }: LoginInput, req): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { userId },
        select: ['id', 'password'],
      });

      if (!user) {
        return { ok: false, error: '존재하지 않는 아이디입니다.' };
      }

      if (!password) {
        return {
          ok: false,
          error: '비밀번호를 입력해주세요.',
        };
      }

      const passwordCorrect = await user.checkPassword(password);

      if (!passwordCorrect) {
        if (user.numberOfLoginAttempts >= 5) {
          return {
            ok: false,
            error: '로그인 횟수가 초과되었습니다. 계정 찾기를 시도해주세요.',
          };
        }

        user.numberOfLoginAttempts += 1;

        await this.users.update(user.id, {
          numberOfLoginAttempts: user.numberOfLoginAttempts,
        });

        return {
          ok: false,
          error: `계정로그인에 실패하였습니다.(${user.numberOfLoginAttempts}/5)`,
        };
      }

      user.accessHistory = new Date();

      if (user.currentRefreshToken) {
        const accessToken = this.jwtService.signAccessToken(user.id);
        const refreshToken = await this.jwtService.refreshTokenVerify(
          user.currentRefreshToken,
        );
        const refreshTokenOptions: CookieOptions = {
          httpOnly: this.configService.get<boolean>('REFRESHTOKEN_HTTP_ONLY'),
          sameSite: this.configService.get('REFRESHTOKEN_SAMESITE'),
          secure: this.configService.get<boolean>('REFRESHTOKEN_SECURE'),
          maxAge: this.configService.get<number>('REFRESHTOKEN_MAX_AGE'),
        };
        req.res.cookie('ndr', refreshToken, refreshTokenOptions);

        await this.users.update(user.id, {
          numberOfLoginAttempts: 0,
          accessHistory: user.accessHistory,
        });
        return {
          ok: true,
          accessToken,
        };
      }
      // Redis에서 기존 세션 정보 삭제
      /* await this.redis.del(`session:${userId}`); */

      const accessToken = this.jwtService.signAccessToken(user.id);
      const refreshToken = this.jwtService.signRefreshToken();

      /*  // Redis에 새 세션 정보 저장
      await this.redis.set(
        `session:${userId}`,
        refreshToken,
        'EX',
        this.configService.get<number>('REFRESHTOKEN_MAX_AGE') / 1000,
      ); */

      await this.users.update(user.id, {
        numberOfLoginAttempts: 0,
        currentRefreshToken: refreshToken,
        accessHistory: user.accessHistory,
      });
      const refreshTokenOptions: CookieOptions = {
        httpOnly: this.configService.get<boolean>('REFRESHTOKEN_HTTP_ONLY'),
        sameSite: this.configService.get('REFRESHTOKEN_SAMESITE'),
        secure: this.configService.get<boolean>('REFRESHTOKEN_SECURE'),
        maxAge: this.configService.get<number>('REFRESHTOKEN_MAX_AGE'),
      };

      req.res.cookie('ndr', refreshToken, refreshTokenOptions);
      return {
        ok: true,
        accessToken,
      };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: '로그인에 실패하였습니다.',
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneByOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: '조회에 실패하였습니다.' };
    }
  }

  async findByUserId({
    email,
    userName,
  }: FindUserIdInput): Promise<FindUserIdOutput> {
    try {
      const user = await this.users.findOne({ where: { email, userName } });
      return {
        ok: true,
        userId: user.userId,
      };
    } catch (error) {
      return {
        ok: false,
        error: '아이디가 존재하지 않습니다. 계정을 생성해주세요.',
      };
    }
  }

  async updateByUserPassword({
    userId,
    password,
    verifyUpdatePassword,
  }: UpdateUserPasswordInput): Promise<UpdateUserPasswordOutput> {
    try {
      const user = await this.users.findOne({ where: { userId } });
      if (!user) {
        return {
          ok: false,
          error: '계정이 존재하지 않습니다. 계정을 생성해주세요.',
        };
      }

      if (password !== verifyUpdatePassword) {
        return {
          ok: false,
          error: '비밀번호가 서로 일치하지 않습니다.',
        };
      }

      user.password = password;

      await this.users.save(user);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '비밀번호 변경을 실패하였습니다.',
      };
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<User> {
    return this.users.findOne({
      where: { currentRefreshToken: refreshToken },
    });
  }

  async updateRefreshToken(user: User, refreshToken: string): Promise<User> {
    await this.users.update(user.id, {
      currentRefreshToken: refreshToken,
    });

    const data = await this.users.findOne({ where: { id: user.id } });

    return data;
  }

  /* refreshToken을 지우기 위한 로직 */
  async checkRefreshToken(id: number): Promise<User> {
    return this.users.findOne({
      where: { id },
      select: { currentRefreshToken: true },
    });
  }

  async logout(
    { id }: User,
    logoutInput: LogoutInput,
    req,
  ): Promise<LogoutOutput> {
    try {
      if (id === logoutInput.id) {
        return {
          ok: false,
          error: '해당 사용자는 logout을 할 수 없습니다.',
        };
      }

      await this.users.update(logoutInput.id, {
        currentRefreshToken: null,
      });

      const refreshTokenOptions: CookieOptions = {
        httpOnly: this.configService.get<boolean>('REFRESHTOKEN_HTTP_ONLY'),
        sameSite: this.configService.get('REFRESHTOKEN_SAMESITE'),
        secure: this.configService.get<boolean>('REFRESHTOKEN_SECURE'),
        maxAge: this.configService.get<number>('REFRESHTOKEN_LOGOUT_MAX_AGE'),
      };

      req.res.cookie('ndr', '', refreshTokenOptions);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Logout is fail',
      };
    }
  }

  async logoutMiddleware(id: number): Promise<LogoutOutput> {
    try {
      await this.users.update(id, {
        currentRefreshToken: null,
      });

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Logout is fail',
      };
    }
  }

  @Cron(`* * * 1 12 *`)
  async befroeDeleteAccountMessage() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const accountData = await this.users.find({
      where: {
        accessHistory: LessThan(threeYearsAgo),
      },
    });

    if (accountData.length > 0) {
      await this.users.remove(accountData);
    } else {
      console.log('삭제할 사용자가 없습니다.');
    }
  }

  @Cron(`* * * 31 12 *`)
  async deleteAccount() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const accountData = await this.users.find({
      where: {
        accessHistory: LessThan(threeYearsAgo),
      },
    });

    if (accountData.length > 0) {
      await this.users.remove(accountData);
    } else {
      console.log('삭제할 사용자가 없습니다.');
    }
  }

  async canMakeAccount(
    userId: string,
    userName: string,
    password: string,
    consentToCollectPersonalData: boolean,
    outsourcingTheProcessingOfPersonalData: boolean,
    passwordCheakFindWord: string,
    passwordCheakRole: PasswordCheakRole,
    termsOfService: boolean,
    verifyPassword: string,
    email: string,
  ): Promise<CreateAccountOutput> {
    const exists = await this.users.findOne({
      where: { userId },
    });

    if (exists) {
      // make error
      return { ok: false, error: '이미 존재하는 아이디입니다.' };
    }

    if (!userId) {
      return { ok: false, error: '사용하실 아이디를 입력해주세요.' };
    }

    if (!email) {
      return { ok: false, error: '이메일을 입력해주세요.' };
    }

    if (!userName) {
      // make error
      return { ok: false, error: '이름을 입력해주세요.' };
    }
    if (!password) {
      // make error
      return { ok: false, error: '비밀번호를 입력해주세요.' };
    }
    if (password !== verifyPassword) {
      return { ok: false, error: '입력하신 비밀번호와 동일하지 않습니다.' };
    }

    if (!verifyPassword) {
      return { ok: false, error: '비밀번호 확인이 필요합니다.' };
    }

    if (!passwordCheakRole) {
      return { ok: false, error: '비밀번호 분실 시 질문을 입력해주세요.' };
    }

    if (!passwordCheakFindWord) {
      return { ok: false, error: '비밀번호 분실 시 답변을 입력해주세요.' };
    }
    /* .some(Boolean): 배열의 요소 중 하나라도 true일 경우 true를 반환, 여기서는 모든 조건이 false일 때만 false를 반환 */
    /* 배열로 조건들을 묶기: 배열 안의 모든  값이 false일 경우만 error를 반환 */
    if (
      ![
        consentToCollectPersonalData,
        outsourcingTheProcessingOfPersonalData,
        termsOfService,
      ].some(Boolean)
    ) {
      return { ok: false, error: '모든 약관에 동의해야 합니다.' };
    }

    if (consentToCollectPersonalData === false) {
      return { ok: false, error: '개인정보 수집에 동의해야 합니다.' };
    }

    if (outsourcingTheProcessingOfPersonalData === false) {
      return { ok: false, error: '개인정보 처리 위탁에 동의해야 합니다.' };
    }

    if (termsOfService === false) {
      return { ok: false, error: '서비스 이용약관에 동의해야 합니다.' };
    }
  }
}
