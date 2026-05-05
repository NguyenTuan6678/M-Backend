import { MessageResponse } from '@app-types/message.res';
import { SalesTransaction } from '@schemas/sale-transaction.schema';

export class SaleTransactionResponseDTO extends MessageResponse {
  content: SalesTransaction;
}
