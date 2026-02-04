import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class RolesAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    // UserRole 불러오기
    const roles = this.reflector.getAllAndOverride<AllowedRoles[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    // UserRole이 존재하지 않으면 모두가 사용가능한 API라는 뜻
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;

    console.log('❌❌❌❌❌❌토큰', token);

    if (token) {
      // context에 토큰이 있으면, 토큰을 decode
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.userService.findById(decoded['id']);

        // user가 없으면 즉 로그인이 되어있지 않으면 false를 반환
        if (!user) {
          return false;
        }
        // user를 graphQL context에 추가
        gqlContext['user'] = user;
        // roles에 Any가 반환되면 true로 반환
        if (roles.includes('Any')) {
          return true;
        }
        return roles.includes(user.role);
      } else {
        // 그외에 token이 문 제있을시 에러처리
        return false;
      }
    } else {
      return false;
    }
  }
}
