import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { SalesTransaction } from '@schemas/sale-transaction.schema';

export class GetAllSaleTransactions extends MessageResponse {
  content?: SalesTransaction[];
  pagination?: PaginatedResponseDto;
}
