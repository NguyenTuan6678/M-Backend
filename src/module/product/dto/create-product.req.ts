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
  @ApiProperty({ example: 'HH001', description: 'Product code' })
  @IsString()
  @IsNotEmpty()
  inv_itemCode: string;

  @ApiProperty({ example: 'Basic Plan', description: 'Product name' })
  @IsString()
  @IsOptional()
  inv_itemName: string;

  @ApiPropertyOptional({ example: 'Phan', description: 'Product unit code' })
  @IsString()
  @IsOptional()
  inv_unitCode?: string;

  @ApiProperty({ example: 245000, description: 'Product price' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  inv_unitPrice: number;

  @ApiProperty({
    example: '8',
    description: 'Product tax code',
  })
  @IsString()
  @IsNotEmpty()
  ma_thue?: string;
}
