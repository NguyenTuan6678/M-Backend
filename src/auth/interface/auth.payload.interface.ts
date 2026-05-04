export interface JwtPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}
