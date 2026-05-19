import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryReceiptInvoiceDto {
  @ApiPropertyOptional({
    description: 'Filter by invoice series',
  })
  @IsOptional()
  @IsString()
  inv_invoiceSeries?: string;

  @ApiPropertyOptional({
    description: 'Filter by tax code',
  })
  @IsOptional()
  @IsString()
  tax_code?: string;

  @ApiPropertyOptional({
    description: 'Search by inv_invoiceSeries or tax_code',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
