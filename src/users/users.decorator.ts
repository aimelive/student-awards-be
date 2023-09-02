import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { verifyToken } from '../utils/helpers';
import { AuthToken } from '../@interfaces/auth-token';

export const AuthUser = createParamDecorator<AuthToken>(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token: string | undefined = request.headers['authorization'];
    if (!token) {
      throw new ForbiddenException('User not logged in');
    }
    try {
      const user = verifyToken<AuthToken>(token.split(' ')[1]);
      if (!user.id) {
        throw new BadRequestException('Something went wrong try again later');
      }
      return user;
    } catch (error) {
      const message = error.message || 'Invalid auth token';
      throw new BadRequestException(message + ', login again to continue.');
    }
  },
);
