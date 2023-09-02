import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpResponse } from '../utils/response';
import { Role, Status } from '@prisma/client';
import { comparePwd, generateToken, hashPwd } from '../utils/helpers';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { LoginDto } from './dto/login-user.dto';
import { AuthToken } from '../@interfaces/auth-token';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.db.user.create({
        data: {
          ...createUserDto,
          password: createUserDto.password
            ? await hashPwd(createUserDto.password)
            : undefined,
        },
      });
      return new HttpResponse('User created successfully!', user);
    } catch (error) {
      if (error.meta?.target === 'User_email_key') {
        error.message =
          'This email is already used, please use a different email.';
        error.status = 409;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async login({ email, password }: LoginDto) {
    try {
      const user = await this.db.user.findFirst({
        where: { email },
        include: { profile: true },
      });
      if (!user) {
        throw new NotFoundException(
          `(${email}) Account with this email does not exist, please try again.`,
        );
      }
      if (!user.verified) {
        throw new ForbiddenException(
          `(${user.firstName} ${user.lastName}) This account is not verified, please contact an admin for help.`,
        );
      }
      if (user.status !== Status.ACTIVE) {
        throw new ForbiddenException(
          `(${user.firstName} ${user.lastName}) ${user.status} account can not log in, please contact an admin for help.`,
        );
      }
      if (!user.password) {
        throw new ForbiddenException(
          `(${user.firstName} ${user.lastName}) This account does not have secure password for security, please check your email to set a security password.`,
        );
      }
      if (!(await comparePwd(password, user.password))) {
        throw new BadRequestException('Incorrect password, please try again.');
      }
      //ADMIN DASHBOARD MORE - SO FAR.
      if (user.role === Role.USER) {
        throw new BadRequestException(
          'Sorry, you should be an admin to be able to continue.',
        );
      }
      return {
        message: 'User logged in successfully!',
        data: { ...user, password: undefined },
        token: generateToken<AuthToken>({ id: user.id, role: user.role }),
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll({ id, role }: AuthToken) {
    let where: any = undefined;
    if (role !== Role.SUPER_ADMIN) {
      where = {
        OR: [{ role: 'USER' }, { id }],
      };
    }
    const users = await this.db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
      skip: 0,
      take: 50,
    });
    return new HttpResponse('Users retrieved successfully', users);
  }

  async findOne(id: string) {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
        include: {
          profile: {
            include: {
              performances: { orderBy: { createdAt: 'desc' } },
              activities: { orderBy: { createdAt: 'desc' } },
              awards: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
      });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      return new HttpResponse('User info retrieved successfully', {
        ...user,
        password: undefined,
      });
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      if (!Object.keys(updateUserDto).length) {
        throw new BadRequestException('No changes made');
      }
      const user = await this.db.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      if (user.role === Role.SUPER_ADMIN && updateUserDto.role) {
        throw new BadRequestException('Super Admin role can not be changed!.');
      }
      if (
        user.role === Role.SUPER_ADMIN &&
        updateUserDto.status &&
        updateUserDto.status !== Status.ACTIVE
      ) {
        throw new BadRequestException(
          'Super Admin account can not be inactive!.',
        );
      }
      if (user.role === Role.SUPER_ADMIN && updateUserDto.email) {
        throw new BadRequestException('Super Admin email can not be changed!');
      }
      const updateUser = await this.db.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          password: updateUserDto.password
            ? await hashPwd(updateUserDto.password)
            : undefined,
          verified: updateUserDto.email ? false : updateUserDto.verified,
        },
      });
      //If the email was changed notify all admins and super admins about the changes
      return new HttpResponse('User account updated successfully', updateUser);
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const deletedUser = await this.db.$transaction(async (prisma) => {
        const user = await prisma.user.delete({
          where: { id },
          include: { profile: true },
        });
        if (user.verified && user.role !== Role.USER) {
          throw new BadRequestException(
            'Verified admin should not be deleted, please unverify this account manually and try again.',
          );
        }
        return user;
      });
      if (deletedUser?.profile?.profilePic) {
        this.eventEmitter.emit(
          'delete.image',
          deletedUser?.profile?.profilePic,
        );
      }
      //TODO: Sending an email that the user has been deleted
      return new HttpResponse(`User deleted successfully!`, deletedUser);
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent('delete.image', { async: true })
  async deleteUploadedImage(payload: string) {
    await this.cloudinary.deleteImage(payload);
  }
}
