import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSaleTransactionBankDto {
  @ApiProperty({
    example: '649a6f1e5f1234567890abd0',
    description: 'Bank ID',
  })
  @IsNotEmpty({ message: 'bankId is required' })
  @IsString({ message: 'bankId must be a string' })
  @IsMongoId({ message: 'bankId must be a valid MongoDB ObjectId' })
  bankId: string;
}
