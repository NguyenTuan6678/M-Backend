import { MessageResponse } from '@app-types/message.res';
import { Department } from '@schemas/department.schema';

export class DepartmentResponseDto extends MessageResponse {
  content?: Department;
}
