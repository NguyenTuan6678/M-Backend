import { MessageResponse } from '@app-types/message.res';
import { User } from '@schemas/users.schema';

export class UsersResponseDTO extends MessageResponse {
  content?: User;
}
