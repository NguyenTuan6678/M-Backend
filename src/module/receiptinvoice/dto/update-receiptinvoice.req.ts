import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReceiptInvoiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inv_invoiceSeries?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tax_code?: string;

  @ApiPropertyOptional({ example: 'Hoa Don May' })
  @IsString()
  @IsOptional()
  description?: string;
}
