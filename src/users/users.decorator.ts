import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthToken } from 'src/@interfaces/auth-token';
import { verifyToken } from 'src/utils/helpers';

export const AuthUser = createParamDecorator<AuthToken>(
  (data: unknown, ctx: ExecutionContext) => {
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
      throw new BadRequestException(error.message || 'Invalid auth token.');
    }
  },
);
