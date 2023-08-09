import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  mixin,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';
import { AuthToken } from 'src/@interfaces/auth-token';
import { verifyToken } from 'src/utils/helpers';

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
        if (role && user.role !== role) {
          throw new ForbiddenException(
            `Access denied, you must be ${role} to perform this action`,
          );
        }
        return true;
      } catch (error) {
        throw new BadRequestException(
          error.message ||
            'Invalid or expired auth token detected, login again',
        );
      }
    }
  }
  const guard = mixin(AuthGuardMixin);
  return guard;
};
