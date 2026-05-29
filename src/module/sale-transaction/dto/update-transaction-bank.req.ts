import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSaleTransactionBankDto {
  @ApiProperty({
    description: 'Amount collected from customer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountCollected?: number;

  @ApiProperty({
    example: '649a6f1e5f1234567890abd0',
    description: 'Bank ID',
  })
  @IsNotEmpty({ message: 'bankId is required' })
  @IsString({ message: 'bankId must be a string' })
  @IsMongoId({ message: 'bankId must be a valid MongoDB ObjectId' })
  bankId: string;
}
