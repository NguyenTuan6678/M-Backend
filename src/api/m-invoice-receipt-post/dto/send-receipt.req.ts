import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemDataDto {
  @ApiPropertyOptional({ example: 1, description: 'Item type' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  tchat?: number;

  @ApiPropertyOptional({ example: 1, description: 'Record order' })
  @IsNotEmpty()
  @IsString()
  stt_rec0?: string;

  @ApiPropertyOptional({
    example: 'SP001',
    description: 'Item code',
  })
  @IsNotEmpty()
  @IsString()
  inv_itemCode?: string;

  @ApiPropertyOptional({
    example: 'Medical Service',
    description: 'Item name',
  })
  @IsOptional()
  @IsString()
  inv_itemName?: string;

  @ApiPropertyOptional({
    example: 'PCS',
    description: 'Unit code',
  })
  @IsOptional()
  @IsString()
  inv_unitCode?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantity',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_quantity?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Unit price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_unitPrice?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount percentage',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_discountPercentage?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Discount amount',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_discountAmount?: number;

  @ApiPropertyOptional({
    example: 180,
    description: 'Total amount without VAT',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_TotalAmountWithoutVat?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Tax code',
  })
  @IsNotEmpty()
  @IsString()
  ma_thue?: string;

  @ApiPropertyOptional({
    example: 18,
    description: 'VAT amount',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_vatAmount?: number;

  @ApiPropertyOptional({
    example: 198,
    description: 'Total amount',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_TotalAmount?: number;
}

export class InvoiceDetailDto {
  @ApiProperty({
    type: [InvoiceItemDataDto],
    description: 'Invoice item details',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDataDto)
  data: InvoiceItemDataDto[];
}

export class InvoiceDataDto {
  @ApiPropertyOptional({
    example: 'AA/26E',
    description: 'Invoice series',
  })
  @IsNotEmpty()
  @IsString()
  inv_invoiceSeries?: string;

  @ApiPropertyOptional({
    example: '15/01/2026 12:00:00 SA',
    description: 'Invoice issued date',
  })
  @IsNotEmpty()
  @IsString()
  inv_invoiceIssuedDate?: string;

  @ApiPropertyOptional({
    example: 'VND',
    description: 'Currency code',
  })
  @IsNotEmpty()
  @IsString()
  inv_currencyCode?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Exchange rate',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_exchangeRate?: number;

  @ApiPropertyOptional({
    example: 'BA001',
    description: 'Medical record number',
  })
  @IsOptional()
  @IsString()
  so_benh_an?: string;

  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Buyer display name',
  })
  @IsOptional()
  @IsString()
  inv_buyerDisplayName?: string;

  @ApiPropertyOptional({
    example: 'Company ABC',
    description: 'Buyer legal name',
  })
  @IsOptional()
  @IsString()
  inv_buyerLegalName?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Buyer tax code',
  })
  @IsOptional()
  @IsString()
  inv_buyerTaxCode?: string;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Buyer address',
  })
  @IsOptional()
  @IsString()
  inv_buyerAddressLine?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Buyer email',
  })
  @IsOptional()
  @IsString()
  inv_buyerEmail?: string;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Buyer bank account',
  })
  @IsOptional()
  @IsString()
  inv_buyerBankAccount?: string;

  @ApiPropertyOptional({
    example: 'VCB',
    description: 'Buyer bank name',
  })
  @IsOptional()
  @IsString()
  inv_buyerBankName?: string;

  @ApiPropertyOptional({
    example: 'Cash',
    description: 'Payment method',
  })
  @IsNotEmpty()
  @IsString()
  inv_paymentMethodName?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount amount',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inv_discountAmount?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Total amount without VAT',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_TotalAmountWithoutVat?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'VAT amount',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_vatAmount?: number;

  @ApiPropertyOptional({
    example: 1100,
    description: 'Total amount',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inv_TotalAmount?: number;

  @ApiPropertyOptional({
    example: 'apikey123',
    description: 'API key',
  })
  @IsOptional()
  @IsString()
  key_api?: string;

  @ApiPropertyOptional({
    example: '077216367178321',
    description: 'Can cuoc cong dan',
  })
  @IsOptional()
  @IsString()
  cccdan?: string;

  @ApiPropertyOptional({
    example: 'G123412A2',
    description: 'So ho chieu',
  })
  @IsOptional()
  @IsString()
  so_hchieu?: string;

  @ApiPropertyOptional({
    example: '20000005',
    description: 'Ma don vi quan he',
  })
  @IsOptional()
  @IsString()
  mdvqhnsach_nmua?: string;

  @ApiPropertyOptional({
    example: 'CUAHANG001',
    description: 'Ma cua hang',
  })
  @IsOptional()
  @IsString()
  ma_ch?: string;

  @ApiPropertyOptional({
    example: 'Cua hang xan dau',
    description: 'Ten cua hang',
  })
  @IsOptional()
  @IsString()
  ten_ch?: string;

  @ApiProperty({
    type: [InvoiceDetailDto],
    description: 'Invoice details',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDetailDto)
  details: InvoiceDetailDto[];
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    example: 0,
    description: 'Edit mode',
  })
  @IsNotEmpty()
  @IsString()
  editmode?: string;

  @ApiProperty({
    type: [InvoiceDataDto],
    description: 'Invoice data',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDataDto)
  data: InvoiceDataDto[];
}
