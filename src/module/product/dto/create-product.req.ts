import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Basic Plan', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, description: 'Product price' })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ example: 0.1, description: 'Product tax rate (decimal)' })
  @Type(() => Number)
  @IsNumber()
  taxRate: number;

  @ApiPropertyOptional({ example: 'ACCT001', description: 'Accounting code' })
  @IsString()
  @IsOptional()
  accountCode?: string;

  @ApiPropertyOptional({
    example: 'Monthly subscription plan',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Is the product active?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
