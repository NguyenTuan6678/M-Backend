import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Sales', description: 'Department name' })
  @IsString()
  @IsOptional()
  departmentName?: string;

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
