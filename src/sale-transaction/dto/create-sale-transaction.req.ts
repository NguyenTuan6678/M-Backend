import {
  IsArray,
  IsBoolean,
  IsDateString,
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
  @ApiProperty({ example: 100, description: 'Item price' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 0.1, description: 'Item tax rate' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  taxRate: number;

  @ApiProperty({ example: 2, description: 'Item quantity' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 200, description: 'Total amount for this item' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  total: number;
}

export class CreateSalesTransactionDto {
  @ApiPropertyOptional({
    example: '2026-05-06T00:00:00.000Z',
    description: 'Activation date of the sale transaction',
  })
  @IsDateString()
  @IsOptional()
  activationDate?: string;

  @ApiProperty({
    example: '649a6f1e5f1234567890abcd',
    description: 'Agency ID',
  })
  @IsMongoId()
  agencyId: string;

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

  @ApiPropertyOptional({ example: 'TXN001', description: 'Tax code' })
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiPropertyOptional({ example: 'Acme Co.', description: 'Company name' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Customer email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '123 Main St',
    description: 'Customer address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the transaction is paid',
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 1000, description: 'Paid amount' })
  @Type(() => Number)
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({
    example: '2026-05-06T00:00:00.000Z',
    description: 'Paid date',
  })
  @IsDateString()
  @IsOptional()
  paidDate?: string;

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
