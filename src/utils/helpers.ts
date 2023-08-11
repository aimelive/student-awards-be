import {
  BadRequestException,
  Injectable,
  PipeTransform,
  createParamDecorator,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isMongoId,
  registerDecorator,
} from 'class-validator';
import * as jwt from 'jsonwebtoken';

export const hashPwd = async (pwd: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pwd, salt);
};

/// Decrypt the password
export const comparePwd = async (bodyPwd: string, dbPwd: string) => {
  return await bcrypt.compare(bodyPwd, dbPwd);
};

//Generate token
export const generateToken = <T>(
  data: T,
  expiresIn: string = '5 days',
): string => {
  const secret = process.env.JWT_TOKEN_SECRET || 'jwt-secret-mcsa';
  return jwt.sign({ data }, secret, {
    expiresIn,
  });
};

/// Verifying jwt token
export function verifyToken<T>(token: string): T {
  const verify: any = jwt.verify(
    token,
    process.env.JWT_TOKEN_SECRET || 'jwt-secret-mcsa',
  );
  return verify.data as T;
}

/**
 * Custom validator
 */
@ValidatorConstraint({ name: 'customDurationFormat', async: false })
class CustomDurationFormatValidator implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    // Custom validation logic for the duration format "12:34"
    const durationPattern = /^\d{2}:\d{2}$/;
    return durationPattern.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'The duration must be in the format "12:34"';
  }
}

export function IsCustomDurationFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCustomDurationFormat',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CustomDurationFormatValidator,
    });
  };
}

export function IsYouTubeUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isYouTubeUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          const isYouTubeHttpsUrl =
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)(\?\S+)?$/.test(
              value,
            );
          return isYouTubeHttpsUrl;
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          return `${validationArguments.property} must be a valid YouTube URL`;
        },
      },
    });
  };
}

export function IsCloudinaryUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCloudinaryUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return value.startsWith('https://res.cloudinary.com/dofeqwgfb/image');
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          return `${validationArguments.property} must be a valid Cloudinary Image URL`;
        },
      },
    });
  };
}

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isMongoId(value)) {
      throw new BadRequestException(`${value} is not a valid MongoDB ObjectId`);
    }
    return value;
  }
}
