import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Employee } from '@schemas/employee.schema';

export class GetAllEmployees extends MessageResponse {
  content?: Employee[];
  pagination?: PaginatedResponseDto;
}
