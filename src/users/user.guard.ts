import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  mixin,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';
import { AuthToken } from '../@interfaces/auth-token';
import { verifyToken } from '../utils/helpers';

export const AuthGuard = (role?: Role) => {
  class AuthGuardMixin implements CanActivate {
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      const token: string | undefined = request.headers['authorization'];

      if (!token) {
        throw new ForbiddenException('User not logged in');
      }

      try {
        const user = verifyToken<AuthToken>(token.split(' ')[1]);
        if (!user.id) {
          throw new BadRequestException('Something went wrong try again later');
        }
        if (role && user.role !== role && user.role !== Role.SUPER_ADMIN) {
          throw new ForbiddenException(
            `Access denied, you must be ${role} to perform this action`,
          );
        }
        return true;
      } catch (error) {
        throw new HttpException(
          error.message ||
            'Invalid or expired auth token detected, login again',
          error.status || 400,
        );
      }
    }
  }
  const guard = mixin(AuthGuardMixin);
  return guard;
};
