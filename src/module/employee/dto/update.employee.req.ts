import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create.employee.req';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
