import {
  ArrayMinSize,
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
  @ApiProperty({
    example: '649a6f1e5f1234567890abd0',
    description: 'Product ID',
  })
  @IsNotEmpty({ message: 'productId is required' })
  @IsString({ message: 'productId must be a string' })
  @IsMongoId({ message: 'productId must be a valid MongoDB ObjectId' })
  productId: string;

  @ApiProperty({ example: 100, description: 'Revenue' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'revenue is required' })
  @IsNumber({}, { message: 'revenue must be a number' })
  revenue: number;

  @ApiProperty({ example: 0.1, description: 'Capital price' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'capitalPrice is required' })
  @IsNumber({}, { message: 'capitalPrice must be a number' })
  capitalPrice: number;

  @ApiProperty({ example: 2, description: 'Total salary' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'totalSalary is required' })
  @IsNumber({}, { message: 'totalSalary must be a number' })
  totalSalary: number;

  @ApiProperty({ example: 200, description: 'Accounting account code' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'accountingAccountCode is required' })
  @IsNumber({}, { message: 'accountingAccountCode must be a number' })
  accountingAccountCode: number;
}

export class CreateSalesTransactionDto {
  @ApiPropertyOptional({ example: '1C26TYY', description: 'Invoice series' })
  @IsOptional()
  @IsString({ message: 'inv_invoiceSeries must be a string' })
  inv_invoiceSeries?: string;

  @ApiPropertyOptional({
    example: '15/01/2026 12:00:00 SA',
    description:
      'Invoice date — neu khong truyen se tu dong lay thoi diem hien tai',
  })
  @IsOptional()
  @IsString({ message: 'inv_invoiceIssuedDate must be a string' })
  inv_invoiceIssuedDate?: string;

  @ApiProperty({
    example: 'VND',
    description: 'Currency code',
  })
  @IsNotEmpty({ message: 'inv_currencyCode is required' })
  @IsString({ message: 'inv_currencyCode must be a string' })
  inv_currencyCode: string;

  @ApiProperty({ example: 1, description: 'Exchange rate' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_exchangeRate is required' })
  @IsNumber({}, { message: 'inv_exchangeRate must be a number' })
  inv_exchangeRate: number;

  @ApiPropertyOptional({
    example: 'A1234DE64',
    description: 'Order number',
  })
  @IsOptional()
  @IsString({ message: 'so_benh_an must be a string' })
  so_benh_an?: string;

  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Buyer name',
  })
  @IsNotEmpty({ message: 'inv_buyerDisplayName is required' })
  @IsString({ message: 'inv_buyerDisplayName must be a string' })
  inv_buyerDisplayName: string;

  @ApiProperty({
    example: 'CONG TY M-INVOICE',
    description: 'Name of purchasing unit',
  })
  @IsNotEmpty({ message: 'inv_buyerLegalName is required' })
  @IsString({ message: 'inv_buyerLegalName must be a string' })
  inv_buyerLegalName: string;

  @ApiProperty({
    example: '0020313-2321321',
    description: 'Buyer tax code',
  })
  @IsNotEmpty({ message: 'inv_buyerTaxCode is required' })
  @IsString({ message: 'inv_buyerTaxCode must be a string' })
  inv_buyerTaxCode: string;

  @ApiProperty({
    example: 'Giap Bat, Hoang Mai, Ha Noi',
    description: 'Buyer address',
  })
  @IsNotEmpty({ message: 'inv_buyerAddressLine is required' })
  @IsString({ message: 'inv_buyerAddressLine must be a string' })
  inv_buyerAddressLine: string;

  @ApiPropertyOptional({
    example: 'abc@gmail.com',
    description: 'Buyer email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'inv_buyerEmail must be a valid email' })
  inv_buyerEmail?: string;

  @ApiPropertyOptional({
    example: '6727621923',
    description: 'Buyer bank account',
  })
  @IsOptional()
  @IsString({ message: 'inv_buyerBankAccount must be a string' })
  inv_buyerBankAccount?: string;

  @ApiPropertyOptional({
    example: 'Ngan Hang TMCP A Chau - ACB',
    description: 'Buyer bank name',
  })
  @IsOptional()
  @IsString({ message: 'inv_buyerBankName must be a string' })
  inv_buyerBankName?: string;

  @ApiProperty({
    example: 'CK',
    description: 'Payment method',
  })
  @IsNotEmpty({ message: 'inv_paymentMethodName is required' })
  @IsString({ message: 'inv_paymentMethodName must be a string' })
  inv_paymentMethodName: string;

  @ApiProperty({ example: 0, description: 'Invoice discount amount' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_discountAmount is required' })
  @IsNumber({}, { message: 'inv_discountAmount must be a number' })
  inv_discountAmount: number;

  @ApiProperty({ example: 0, description: 'Invoice total amount without VAT' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_TotalAmountWithoutVAT is required' })
  @IsNumber({}, { message: 'inv_TotalAmountWithoutVAT must be a number' })
  inv_TotalAmountWithoutVAT: number;

  @ApiProperty({ example: 0, description: 'Invoice VAT amount' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_vatAmount is required' })
  @IsNumber({}, { message: 'inv_vatAmount must be a number' })
  inv_vatAmount: number;

  @ApiProperty({ example: 0, description: 'Invoice total amount' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_TotalAmount is required' })
  @IsNumber({}, { message: 'inv_TotalAmount must be a number' })
  inv_TotalAmount: number;

  @ApiPropertyOptional({
    example: 'D123123AD1213',
    description: 'Key api',
  })
  @IsOptional()
  @IsString({ message: 'key_api must be a string' })
  key_api?: string;

  @ApiPropertyOptional({
    example: '82731893193718',
    description: 'Citizen identity card',
  })
  @IsOptional()
  @IsString({ message: 'cccdan must be a string' })
  cccdan?: string;

  @ApiPropertyOptional({
    example: 'G1231D1213',
    description: 'Passport number',
  })
  @IsOptional()
  @IsString({ message: 'so_hchieu must be a string' })
  so_hchieu?: string;

  @ApiPropertyOptional({
    example: '2000005',
    description: 'Budget relationship unit code',
  })
  @IsOptional()
  @IsString({ message: 'mdvqhnsach_nmua must be a string' })
  mdvqhnsach_nmua?: string;

  @ApiPropertyOptional({
    example: 'CUAHANG001',
    description: 'Store code',
  })
  @IsOptional()
  @IsString({ message: 'ma_ch must be a string' })
  ma_ch?: string;

  @ApiPropertyOptional({
    example: 'Cua hang xang dau so 001',
    description: 'Store name',
  })
  @IsOptional()
  @IsString({ message: 'ten_ch must be a string' })
  ten_ch?: string;

  @ApiPropertyOptional({ example: 10, description: 'Product quantity' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'inv_quantity must be a number' })
  inv_quantity?: number;

  @ApiProperty({ example: 0, description: 'Product discount percentage' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'inv_discountPercentage is required' })
  @IsNumber({}, { message: 'inv_discountPercentage must be a number' })
  inv_discountPercentage: number;

  @ApiProperty({
    example: '649a6f1e5f1234567890abcd',
    description: 'Agency ID',
  })
  @IsNotEmpty({ message: 'agencyId is required' })
  @IsString({ message: 'agencyId must be a string' })
  @IsMongoId({ message: 'agencyId must be a valid MongoDB ObjectId' })
  agencyId: string;

  @ApiProperty({
    example: '649a6f1e5f1234567890abce',
    description: 'Department ID',
  })
  @IsNotEmpty({ message: 'departmentId is required' })
  @IsString({ message: 'deparmentId must be a string' })
  @IsMongoId({ message: 'departmentId must be a valid MongoDB ObjectId' })
  departmentId: string;

  @ApiProperty({
    example: '649a6f1e5f1234567890abcf',
    description: 'Employee ID',
  })
  @IsNotEmpty({ message: 'employeeId is required' })
  @IsString({ message: 'employeeId must be a string' })
  @IsMongoId({ message: 'employeeId must be a valid MongoDB ObjectId' })
  employeeId: string;

  @ApiProperty({
    example: '649a6f1e5f1234567890abd0',
    description: 'Bank ID',
  })
  @IsNotEmpty({ message: 'bankId is required' })
  @IsString({ message: 'bankId must be a string' })
  @IsMongoId({ message: 'bankId must be a valid MongoDB ObjectId' })
  bankId: string;

  @ApiProperty({
    type: [TransactionItemDto],
    description: 'List of transaction items',
  })
  @IsArray({ message: 'items must be an array' })
  @ArrayMinSize(1, { message: 'items must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];
}
