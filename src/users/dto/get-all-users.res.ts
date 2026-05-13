import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { User } from '@schemas/users.schema';

export class GetAllUsers extends MessageResponse {
  content?: User[];
  pagination?: PaginatedResponseDto;
}
