import { Role } from '@prisma/client';

export interface AuthToken {
  id: string;
  role: Role;
}
