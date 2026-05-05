import { MessageResponse } from '@app-types/message.res';
import { Expose, Transform } from 'class-transformer';
import { SalesTransaction } from '../schemas/sale-transaction.schema';

export class SaleTransactionResponseDTO extends MessageResponse {
  content: SalesTransaction;
}
