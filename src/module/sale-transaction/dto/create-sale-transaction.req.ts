import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionItemDto {
  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abd0',
    description: 'Product ID',
  })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiProperty({ example: 100, description: 'Revenue' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  revenue: number;

  @ApiProperty({ example: 0.1, description: 'Capital price' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  capitalPrice: number;

  @ApiProperty({ example: 2, description: 'Total salary' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  totalSalary: number;

  @ApiProperty({ example: 200, description: 'Accounting account code' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  accountingAccountCode: number;
}

export class CreateSalesTransactionDto {
  @ApiProperty({
    example: '15/01/2026 12:00:00 SA',
    description: 'Activation Date',
  })
  @IsNotEmpty()
  @IsString()
  activationDate?: string;

  @ApiPropertyOptional({ example: '1C26TYY', description: 'Invoice series' })
  @IsString()
  @IsOptional()
  inv_invoiceSeries?: string;

  @ApiPropertyOptional({
    example: '15/01/2026 12:00:00 SA',
    description:
      'Invoice date — neu khong truyen se tu dong lay thoi diem hien tai',
  })
  @IsOptional()
  @IsString()
  inv_invoiceIssuedDate?: string;

  @ApiProperty({
    example: 'VND',
    description: 'Currency code',
  })
  @IsNotEmpty()
  @IsString()
  inv_currencyCode?: string;

  @ApiProperty({ example: 1, description: 'Exchange rate' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_exchangeRate: number;

  @ApiProperty({
    example: 'A1234DE64',
    description: 'Order number',
  })
  @IsOptional()
  @IsString()
  so_benh_an?: string;

  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Buyer name',
  })
  @IsNotEmpty()
  @IsString()
  inv_buyerDisplayName?: string;

  @ApiProperty({
    example: 'CONG TY M-INVOICE',
    description: 'Name of purchasing unit',
  })
  @IsNotEmpty()
  @IsString()
  inv_buyerLegalName?: string;

  @ApiProperty({
    example: '0020313-2321321',
    description: 'Buyer tax code',
  })
  @IsNotEmpty()
  @IsString()
  inv_buyerTaxCode?: string;

  @ApiProperty({
    example: 'Giap Bat, Hoang Mai, Ha Noi',
    description: 'Buyer address',
  })
  @IsNotEmpty()
  @IsString()
  inv_buyerAddressLine?: string;

  @ApiProperty({
    example: 'abc@gmail.com',
    description: 'Buyer email',
  })
  @IsOptional()
  @IsEmail()
  inv_buyerEmail?: string;

  @ApiProperty({
    example: '6727621923',
    description: 'Buyer bank account',
  })
  @IsOptional()
  @IsString()
  inv_buyerBankAccount?: string;

  @ApiProperty({
    example: 'Ngan Hang TMCP A Chau - ACB',
    description: 'Buyer bank name',
  })
  @IsOptional()
  @IsString()
  inv_buyerBankName?: string;

  @ApiProperty({
    example: 'CK',
    description: 'Payment method',
  })
  @IsNotEmpty()
  @IsString()
  inv_paymentMethodName?: string;

  @ApiProperty({ example: 0, description: 'Invoice discount amount' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_discountAmount: number;

  @ApiProperty({ example: 0, description: 'Invoice total amount without VAT' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_TotalAmountWithoutVAT: number;

  @ApiProperty({ example: 0, description: 'Invoice VAT amount' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_vatAmount: number;

  @ApiProperty({ example: 0, description: 'Invoice total amount' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_TotalAmount: number;

  @ApiProperty({
    example: 'D123123AD1213',
    description: 'Key api',
  })
  @IsOptional()
  @IsString()
  key_api?: string;

  @ApiProperty({
    example: '82731893193718',
    description: 'Citizen identity card',
  })
  @IsOptional()
  @IsString()
  cccdan?: string;

  @ApiProperty({
    example: 'G1231D1213',
    description: 'Passport number',
  })
  @IsOptional()
  @IsString()
  so_hchieu?: string;

  @ApiProperty({
    example: '2000005',
    description: 'Budget relationship unit code',
  })
  @IsOptional()
  @IsString()
  mdvqhnsach_nmua?: string;

  @ApiProperty({
    example: 'CUAHANG001',
    description: 'Store code',
  })
  @IsOptional()
  @IsString()
  ma_ch?: string;

  @ApiProperty({
    example: 'Cua hang xang dau so 001',
    description: 'Store name',
  })
  @IsOptional()
  @IsString()
  ten_ch?: string;

  @ApiProperty({ example: 10, description: 'Product quantity' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  inv_quantity: number;

  @ApiProperty({ example: 0, description: 'Product discount percentage' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_discountPercentage: number;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abcd',
    description: 'Agency ID',
  })
  @IsMongoId()
  @IsOptional()
  agencyId?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abce',
    description: 'Department ID',
  })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abcf',
    description: 'Employee ID',
  })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abd0',
    description: 'Bank ID',
  })
  @IsMongoId()
  @IsOptional()
  bankId?: string;

  @ApiProperty({
    type: [TransactionItemDto],
    description: 'List of transaction items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];
}
