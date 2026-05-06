import { PartialType } from '@nestjs/swagger';
import { CreateSalesTransactionDto } from './create-sale-transaction.req';

export class UpdateTransactionDto extends PartialType(
  CreateSalesTransactionDto,
) {}
