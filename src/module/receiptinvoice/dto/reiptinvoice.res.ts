import { MessageResponse } from '@app-types/message.res';
import { ReceiptInvoice } from '@schemas/receiptinvoice.schema';

export class ReceiptInvoiceResponseDto extends MessageResponse {
  content?: ReceiptInvoice;
}
