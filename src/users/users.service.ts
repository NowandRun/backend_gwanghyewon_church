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
import { LogoutOutput } from './dtos/logout.dto';
import { Context } from '@nestjs/graphql';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    userId,
    userName,
    password,
    service,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      userId = 'wavenexus' + userId;
      const exists = await this.users.findOne({
        where: { userId },
      });
      if (exists) {
        // make error
        return { ok: false, error: 'There is a user with that email already' };
      }

      await this.users.save(
        this.users.create({ userId, password, role, service, userName }),
      );
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ userId, password }: LoginInput): Promise<LoginOutput> {
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

      return {
        ok: true,
        accessToken,
        refreshToken,
      };
    } catch (error) {
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
    const data = await this.users.save({ ...user, refreshToken: refreshToken });
    return data;
  }

  /* refreshToken을 지우기 위한 로직 */
  async checkRefreshToken(id: number): Promise<User> {
    return this.users.findOne({
      where: { id },
      select: { currentRefreshToken: true },
    });
  }

  async logout({ id }: User): Promise<LogoutOutput> {
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
