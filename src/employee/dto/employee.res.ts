import { MessageResponse } from '@app-types/message.res';
import { Employee } from '@schemas/employee.schema';

export class EmployeeResponseDto extends MessageResponse {
  content?: Employee;
}
