import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'HH001' })
  @IsString()
  @IsNotEmpty()
  inv_itemCode: string;

  @ApiPropertyOptional({ example: 'Hang hoa 001' })
  @IsString()
  @IsOptional()
  inv_itemName?: string;

  @ApiPropertyOptional({ example: 'Phan' })
  @IsString()
  @IsOptional()
  inv_unitCode?: string;

  @ApiProperty({ example: 245000, description: 'A — Giá sản phẩm' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_unitPrice: number;

  @ApiProperty({ example: 2, description: 'B — Số lượng' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_quantity: number;

  @ApiProperty({ example: 0, description: 'C — Chiết khấu' })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  inv_discountAmount: number;

  @ApiProperty({ example: '8', description: 'D — Thuế suất (%)' })
  @IsString()
  @IsNotEmpty()
  ma_thue: string;
}
