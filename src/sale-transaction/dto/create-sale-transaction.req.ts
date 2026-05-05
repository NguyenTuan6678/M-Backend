import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class TransactionItemDto {
  price: number;
  taxRate: number;
  quantity: number;
  total: number;
}

export class CreateSalesTransactionDto {
  @IsDateString()
  @IsOptional()
  activationDate?: string;

  @IsMongoId()
  agencyId: string;

  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  taxCode?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @Type(() => Number)
  @IsOptional()
  paidAmount?: number;

  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @IsMongoId()
  @IsOptional()
  bankId?: string;

  // Items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];
}
