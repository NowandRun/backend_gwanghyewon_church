import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
  CreateAdminInput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { PasswordCheakRole, User, UserRole } from './entities/user.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { ConfigService } from '@nestjs/config';
import { FindUserIdInput, FindUserIdOutput } from './dtos/find-user-id.dto';
import {
  UpdateUserPasswordInput,
  UpdateUserPasswordOutput,
} from './dtos/update-user-password.dto';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { UserInformationConsent } from './entities/user-information-consent.entity';
import { JwtService } from '../jwt/jwt.service';
import { PUB_SUB } from '../common/common.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserInformationConsent)
    private readonly userInformationConsents: Repository<UserInformationConsent>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  async createAccount({
    userId,
    userName,
    password,
    consentToCollectPersonalData,
    outsourcingTheProcessingOfPersonalData,
    passwordCheakFindWord,
    passwordCheakRole,
    termsOfService,
    address,
    parish,
    religious,
    verifyPassword,
    nickname,
    /* email, */
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
        nickname,
        /* email, */
      );

      if (
        termsOfService === false ||
        outsourcingTheProcessingOfPersonalData === false ||
        consentToCollectPersonalData === false
      ) {
        let message = '';

        if (
          termsOfService === false &&
          outsourcingTheProcessingOfPersonalData === false &&
          consentToCollectPersonalData === false
        ) {
          message =
            '서비스 약관 및 개인정보수집 및 개인정보처리에 대한 확인이 필요합니다.';
        } else if (
          termsOfService === false &&
          outsourcingTheProcessingOfPersonalData === false
        ) {
          message = '서비스 약관 및 개인정보처리에 대한 확인이 필요합니다.';
        } else if (
          outsourcingTheProcessingOfPersonalData === false &&
          consentToCollectPersonalData === false
        ) {
          message = '개인정보수집 및 개인정보처리에 대한 확인이 필요합니다.';
        } else if (
          termsOfService === false &&
          consentToCollectPersonalData === false
        ) {
          message = '서비스 약관 및 개인정보처리에 대한 확인이 필요합니다.';
        } else if (termsOfService === false) {
          message = '서비스 약관을 확인해주세요.';
        } else if (outsourcingTheProcessingOfPersonalData === false) {
          message = '개인 정보 처리를 수락해주세요.';
        } else if (consentToCollectPersonalData === false) {
          message = '개인 데이터 처리를 확인해주세요.';
        }

        return {
          ok: false,
          error: message,
        };
      }

      const userdata = this.users.create({
        userId,
        password,
        userName,
        address,
        parish,
        passwordCheakFindWord,
        passwordCheakRole,
        religious,
        nickname,
        /* email, */
      });
      const savedUser = await this.users.save(userdata);

      const userAgreeInfomation = this.userInformationConsents.create({
        outsourcingTheProcessingOfPersonalData,
        termsOfService,
        consentToCollectPersonalData,
        user: savedUser,
      });

      await this.userInformationConsents.save(userAgreeInfomation);

      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: '계정생성에 실패하였습니다. 관리자에게 문의하세요.',
      };
    }
  }

  async createAdminAccount(
    superAdmin: User,
    input: CreateAdminInput,
  ): Promise<CreateAccountOutput> {
    if (superAdmin.role !== UserRole.SuperAdmin) {
      return {
        ok: false,
        error: '슈퍼 관리자만 관리자 계정을 생성할 수 있습니다.',
      };
    }

    const user = this.users.create({
      ...input,
      role: UserRole.Admin,
    });

    await this.users.save(user);

    return { ok: true };
  }

  async login({ userId, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { userId },
        select: ['id', 'password', 'numberOfLoginAttempts'],
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

      if (user.numberOfLoginAttempts >= 5) {
        return {
          ok: false,
          error: '로그인 횟수가 초과되었습니다. 계정 찾기를 시도해주세요.',
        };
      }

      const passwordCorrect = await user.checkPassword(password);

      if (!passwordCorrect) {
        // atomic increment
        await this.users.increment({ id: user.id }, 'numberOfLoginAttempts', 1);

        // fetch the updated value (optional, to return in message)
        const updated = await this.users.findOne({
          where: { id: user.id },
          select: ['numberOfLoginAttempts'],
        });

        const attempts = updated?.numberOfLoginAttempts ?? 0;
        if (attempts >= 5) {
          return {
            ok: false,
            error: '로그인 횟수가 초과되었습니다. 계정 찾기를 시도해주세요.',
          };
        }

        return {
          ok: false,
          error: `계정로그인에 실패하였습니다.(${attempts}/5)`,
        };
      }

      user.accessHistory = new Date();

      const token = this.jwtService.sign(user.id);

      await this.users.update(user.id, {
        numberOfLoginAttempts: 0,
        accessHistory: user.accessHistory,
      });

      /* const refreshTokenOptions: CookieOptions = {
        httpOnly: this.configService.get<boolean>('REFRESHTOKEN_HTTP_ONLY'),
        sameSite: this.configService.get('REFRESHTOKEN_SAMESITE'),
        secure: this.configService.get<boolean>('REFRESHTOKEN_SECURE'),
        maxAge: this.configService.get<number>('REFRESHTOKEN_MAX_AGE'),
      };
 */
      return {
        ok: true,
        token,
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
    /* email, */
    userName,
  }: FindUserIdInput): Promise<FindUserIdOutput> {
    try {
      const user = await this.users.findOne({
        where: { /* email, */ userName },
      });
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
    selectFindUserQuestion,
    verifyQuestionAnswer,
  }: UpdateUserPasswordInput): Promise<UpdateUserPasswordOutput> {
    const ERROR_MESSAGES = {
      userNotFound: '계정이 존재하지 않습니다. 계정을 생성해주세요.',
      invalidQuestion: '질문이 올바르지 않습니다.',
      invalidAnswer: '질문의 답변이 올바르지 않습니다.',
      passwordMismatch: '비밀번호가 서로 일치하지 않습니다.',
      updateFailed: '비밀번호 변경을 실패하였습니다.',
    };

    try {
      const user = await this.users.findOne({ where: { userId } });
      if (!user) {
        return { ok: false, error: ERROR_MESSAGES.userNotFound };
      }

      if (selectFindUserQuestion !== user.passwordCheakRole) {
        return { ok: false, error: ERROR_MESSAGES.invalidQuestion };
      }

      if (verifyQuestionAnswer !== user.passwordCheakFindWord) {
        return { ok: false, error: ERROR_MESSAGES.invalidAnswer };
      }

      if (password !== verifyUpdatePassword) {
        return { ok: false, error: ERROR_MESSAGES.passwordMismatch };
      }

      user.password = password;
      user.numberOfLoginAttempts = 0;

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

  /* async updateRefreshToken(user: User, refreshToken: string): Promise<User> {
    await this.users.update(user.id, {
      currentRefreshToken: refreshToken,
    });

    const data = await this.users.findOne({ where: { id: user.id } });

    return data;
  } */

  /* refreshToken을 지우기 위한 로직 */
  /* async checkRefreshToken(id: number): Promise<User> {
    return this.users.findOne({
      where: { id },
      select: { currentRefreshToken: true },
    });
  }
 */

  /* @Cron(`* * * * 12 *`)
  async beforeDeleteAccountMessage() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const accountData = await this.users.find({
      where: {
        accessHistory: LessThan(threeYearsAgo),
      },
    });
    if (accountData.length > 0) {
      // 모든 사용자에게 데이터 발송
      await this.pubSub.publish(NEW_DELETE_ACCOUNT_MESSAGE, {
        sendingDeleteAccountMessage: accountData,
      });
    } else {
      console.log('삭제할 사용자가 없습니다.');
    }
  } */

  /* @Cron(`0 0 0 31 12 *`)
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
  } */

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
    nickname: string,
    /* email: string, */
  ): Promise<CreateAccountOutput> {
    const idExists = await this.users.findOne({
      where: { userId },
    });

    const nicknameExists = await this.users.findOne({
      where: { nickname },
    });

    if (idExists) {
      // make error
      return { ok: false, error: '이미 존재하는 아이디입니다.' };
    }

    if (!userId) {
      return { ok: false, error: '사용하실 아이디를 입력해주세요.' };
    }

    /* if (!email) {
      return { ok: false, error: '이메일을 입력해주세요.' };
    } */

    if (!userName) {
      // make error
      return { ok: false, error: '이름을 입력해주세요.' };
    }

    if (!nickname) {
      // make error
      return { ok: false, error: '게시판 명을 입력해주세요.' };
    }

    if (nicknameExists) {
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');
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
