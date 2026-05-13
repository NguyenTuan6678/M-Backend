import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Bank } from '@schemas/bank.schema';

export class GetAllBanks extends MessageResponse {
  content?: Bank[];
  pagination?: PaginatedResponseDto;
}
