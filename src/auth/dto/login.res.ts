import { MessageResponse } from 'types/message.res';

export class LoginResType {
  accessToken: string;
  expiresToken: number;
  refreshToken: string;
  expRefreshToken: number;
}

export class LoginRes extends MessageResponse {
  content: LoginResType;
}
