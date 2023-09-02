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
        throw new ForbiddenException(
          'Authentication token is missing, please login to continue.',
        );
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
        if (error.message == 'jwt expired') {
          error.message = 'Session has expired';
        }
        const message = error.message || 'Invalid auth token';
        throw new HttpException(
          {
            message: message + ', please login again to continue.',
            error: 'Authentication Failed',
          },
          error.status || 400,
        );
      }
    }
  }
  const guard = mixin(AuthGuardMixin);
  return guard;
};
