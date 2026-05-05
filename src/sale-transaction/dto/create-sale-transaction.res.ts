import { MessageResponse } from '@app-types/message.res';
import { SalesTransaction } from '@schemas/sale-transaction.schema';

export class CreateSalesTransactionResponseDto extends MessageResponse {
  content?: SalesTransaction;
}
