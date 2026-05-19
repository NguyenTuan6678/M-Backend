import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuerySaleTransactionDto {
  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abcd',
    description: 'Filter by agency ID',
  })
  @IsOptional()
  @IsMongoId()
  agency_Id?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abce',
    description: 'Filter by employee ID',
  })
  @IsOptional()
  @IsMongoId()
  employee_Id?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abcf',
    description: 'Filter by department ID',
  })
  @IsOptional()
  @IsMongoId()
  department_Id?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abd0',
    description: 'Filter by bank ID',
  })
  @IsOptional()
  @IsMongoId()
  bank_Id?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by isActive status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date filter (createdAt)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'End date filter (createdAt)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description:
      'Text search — tìm trong inv_buyerDisplayName, inv_buyerTaxCode, orderNumber',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
