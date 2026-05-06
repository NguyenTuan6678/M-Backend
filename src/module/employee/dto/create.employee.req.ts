import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Full name of the employee',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'employee@example.com',
    description: 'Employee email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Employee phone number',
  })
  @Matches(/^[0-9]{10}$/)
  @IsOptional()
  phone?: string;

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
