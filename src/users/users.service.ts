import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { LogoutInput, LogoutOutput } from './dtos/logout.dto';
import { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createAccount({
    userId,
    userName,
    password,
    service,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({
        where: { userId },
      });
      if (exists) {
        // make error
        return { ok: false, error: 'There is a user with that email already' };
      }
      const userdata = this.users.create({
        userId,
        password,
        role,
        service,
        userName,
      });
      await this.users.save(userdata);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ userId, password }: LoginInput, req): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { userId },
        select: ['id', 'password'],
      });
      if (!user) {
        return { ok: false, error: 'User not found' };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      const accessToken = this.jwtService.signAccessToken(user.id);
      const refreshToken = this.jwtService.signRefreshToken();

      await this.users.update(user.id, {
        currentRefreshToken: refreshToken,
      });

      const refreshTokenOptions: CookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 604800000,
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
        error: "Couldn't login account",
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
      return { ok: false, error: 'Failed findById' };
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

      const accessTokenOptions: CookieOptions = {
        httpOnly: this.configService.get<boolean>('ACCESSTOKEN_HTTP_ONLY'),
        sameSite: this.configService.get('ACCESSTOKEN_SAMESITE'),
        secure: this.configService.get<boolean>('ACCESSTOKEN_SECURE'),
        maxAge: this.configService.get<number>('ACCESSTOKEN_LOGOUT_MAX_AGE'),
      };

      const refreshTokenOptions: CookieOptions = {
        httpOnly: this.configService.get<boolean>('REFRESHTOKEN_HTTP_ONLY'),
        sameSite: this.configService.get('REFRESHTOKEN_SAMESITE'),
        secure: this.configService.get<boolean>('REFRESHTOKEN_SECURE'),
        maxAge: this.configService.get<number>('REFRESHTOKEN_LOGOUT_MAX_AGE'),
      };

      req.res.cookie('nda', '', accessTokenOptions);
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
}
