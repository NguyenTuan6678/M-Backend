import { IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionItemDto {
  @ApiProperty({
    description: 'ID of the product',
    example: '60c72b2f9b1d8e5a5c8f9b1d',
  })
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Price of the product',
    example: 19.99,
  })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Tax rate for the product',
    example: 0.07,
  })
  @Type(() => Number)
  @IsNumber()
  taxRate: number;

  @ApiProperty({
    description:
      'Total amount for this transaction item (optional, can be auto-calculated)',
    example: 42.78,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  total?: number; // backend can auto-calc
}
