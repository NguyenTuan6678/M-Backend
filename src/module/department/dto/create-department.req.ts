import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Sales', description: 'Department name' })
  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @ApiPropertyOptional({
    example: 'Handles customer sales',
    description: 'Department description',
  })
  @IsString()
  @IsOptional()
  departmentDescription?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the department is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
