import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReceiptInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inv_invoiceSeries: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tax_code: string;
}
