import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Product } from '@schemas/product.schema';

export class GetAllProducts extends MessageResponse {
  content?: Product[];
  pagination?: PaginatedResponseDto;
}
