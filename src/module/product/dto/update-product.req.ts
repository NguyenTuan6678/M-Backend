import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Hang hoa 001' })
  @IsString()
  @IsOptional()
  inv_itemName?: string;

  @ApiPropertyOptional({ example: 'Phan' })
  @IsString()
  @IsOptional()
  inv_unitCode?: string;

  @ApiPropertyOptional({ example: 245000, description: 'A — Giá sản phẩm' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  inv_unitPrice?: number;

  @ApiPropertyOptional({ example: 2, description: 'B — Số lượng' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  inv_quantity?: number;

  @ApiPropertyOptional({ example: 0, description: 'C — Chiết khấu' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  inv_discountAmount?: number;

  @ApiPropertyOptional({
    example: '',
    description: 'Item product name',
  })
  @IsString({ message: 'inv_itemProduct must be a string' })
  @IsOptional()
  inv_itemProduct?: string;

  @ApiPropertyOptional({ example: '8', description: 'D — Thuế suất (%)' })
  @IsString()
  @IsOptional()
  ma_thue?: string;
}
