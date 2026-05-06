import { Role } from '@utils/role.enum';

export interface JwtPayload {
  id: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}
