import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Agency } from '@schemas/agency.schema';

export class GetAllAgencies extends MessageResponse {
  content?: Agency[];
  pagination?: PaginatedResponseDto;
}
