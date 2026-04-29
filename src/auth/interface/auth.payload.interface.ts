export interface JwtPayload {
  id: string;
  username: string;
  iat?: number; // issued at (auto added by JWT)
  exp?: number; // expiration (auto added by JWT)
}
