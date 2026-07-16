import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@utils/transaction-status';

export class QuerySaleTransactionReportDto {
  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Start date. Format: YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'End date. Format: YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: InvoiceStatus,
    example: InvoiceStatus.ISSUED,
    description: 'Invoice status filter',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  invoiceStatus?: InvoiceStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Payment status filter',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;

    return value;
  })
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  agencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  bankId?: string;

  @ApiPropertyOptional({
    enum: ['unpaid', 'draft_paid'],
    description: 'Special report type filter: unpaid or draft_paid',
  })
  @IsOptional()
  @IsString()
  reportType?: 'unpaid' | 'draft_paid';
}
