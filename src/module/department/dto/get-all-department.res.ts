import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Department } from '@schemas/department.schema';

export class GetAllDepartments extends MessageResponse {
  content?: Department[];
  pagination?: PaginatedResponseDto;
}
