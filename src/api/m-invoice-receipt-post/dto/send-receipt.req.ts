import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemDataDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tchat?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stt_rec0?: number;

  @ApiPropertyOptional({ example: 'SP001' })
  @IsOptional()
  @IsString()
  inv_itemCode?: string;

  @ApiPropertyOptional({ example: 'Medical Service' })
  @IsOptional()
  @IsString()
  inv_itemName?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  inv_unitCode?: string;

  @ApiProperty({ example: 100000, description: 'A — Giá sản phẩm' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ example: 2, description: 'B — Số lượng' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_quantity: number;

  @ApiProperty({ example: 10000, description: 'C — Chiết khấu' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_discountAmount: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_discountPercentage?: number;

  @ApiProperty({ example: 8, description: 'D — Thuế suất (%)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  ma_thue: number;
}

export class InvoiceDetailDto {
  @ApiProperty({ type: [InvoiceItemDataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDataDto)
  data: InvoiceItemDataDto[];
}

export class InvoiceDataDto {
  @IsOptional() @IsString() inv_invoiceSeries?: string;
  @IsOptional() @IsString() KHHD?: string;
  @IsOptional() @IsString() inv_invoiceIssuedDate?: string;
  @IsOptional() @IsString() inv_currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() inv_exchangeRate?: number;
  @IsOptional() @IsString() so_benh_an?: string;
  @IsOptional() @IsString() inv_buyerDisplayName?: string;
  @IsOptional() @IsString() inv_buyerLegalName?: string;
  @IsOptional() @IsString() inv_buyerTaxCode?: string;
  @IsOptional() @IsString() inv_buyerAddressLine?: string;
  @IsOptional() @IsString() inv_buyerEmail?: string;
  @IsOptional() @IsString() inv_buyerBankAccount?: string;
  @IsOptional() @IsString() inv_buyerBankName?: string;
  @IsOptional() @IsString() inv_paymentMethodName?: string;
  @IsOptional() @Type(() => Number) @IsNumber() inv_discountAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_TotalAmountWithoutVat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() inv_vatAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() inv_TotalAmount?: number;
  @IsOptional() @IsString() key_api?: string;
  @IsOptional() @IsString() cccdan?: string;
  @IsOptional() @IsString() so_hchieu?: string;
  @IsOptional() @IsString() mdvqhnsach_nmua?: string;
  @IsOptional() @IsString() ma_ch?: string;
  @IsOptional() @IsString() ten_ch?: string;

  @IsOptional() @IsString() inv_invoiceAuth_id?: string;
  @IsOptional() @Type(() => Number) @IsNumber() inv_invoiceNumber?: number;

  @ApiProperty({ type: [InvoiceDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDetailDto)
  details: InvoiceDetailDto[];
}

export class CreateInvoiceDto {
  @IsOptional() @Type(() => Number) @IsNumber() editmode?: number;

  @ApiProperty({ type: [InvoiceDataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDataDto)
  data: InvoiceDataDto[];
}

export class CreateInvoiceFromTransactionDto {
  @ApiProperty({ example: '649a6f1e5f1234567890abcd' })
  @IsMongoId()
  @IsNotEmpty()
  saleTransactionId: string;

  @ApiProperty({ example: '1C26TYY', description: 'Invoice series' })
  @IsNotEmpty()
  @IsString()
  inv_invoiceSeries: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Invoice Issued Date',
  })
  @IsOptional()
  @IsString()
  inv_invoiceIssuedDate?: string;

  @ApiPropertyOptional({
    example: 1,
    description: '1 = Add, 2 = Edit, 3 = Delete',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  editmode?: number;

  @ApiPropertyOptional({
    example: 950,
    description: 'Invoice number (for editmode = 2)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_invoiceNumber?: number;

  @ApiPropertyOptional({
    example: 'F5458A39-B278-4D90-9AAC-209BF79A23CD',
    description: 'Invoice Auth ID (for editmode = 2)',
  })
  @IsOptional()
  @IsString()
  inv_invoiceAuth_id?: string;
}
