import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Full name of the employee',
  })
  @IsString()
  @IsOptional()
  employeeName?: string;

  @ApiPropertyOptional({
    example: 'employee@example.com',
    description: 'Employee email address',
  })
  @IsEmail()
  @IsOptional()
  employeeEmail?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Employee phone number',
  })
  @Matches(/^[0-9]{10}$/)
  @IsOptional()
  employeePhone?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abce',
    description: 'Department ID',
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the employee is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
