import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ViewInvoiceDto {
  @ApiProperty({
    description: 'Sale transaction ID để lấy inv_invoiceCreatedId',
  })
  @IsString()
  saleTransactionId: string;
}
