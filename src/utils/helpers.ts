import * as bcrypt from 'bcrypt';
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
