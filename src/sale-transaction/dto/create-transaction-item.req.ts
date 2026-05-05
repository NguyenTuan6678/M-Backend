import { IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionItemDto {
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsNumber()
  taxRate: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  total?: number; // backend can auto-calc
}
