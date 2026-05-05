import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentDto } from '@department/dto/create-department.req';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
