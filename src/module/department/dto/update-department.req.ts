import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentDto } from './create-department.req';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
