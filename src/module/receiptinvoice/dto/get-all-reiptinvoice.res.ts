import { MessageResponse } from '@app-types/message.res';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { ReceiptInvoice } from '@schemas/receiptinvoice.schema';

export class GetAllReceiptInvoices extends MessageResponse {
  content?: ReceiptInvoice[];
  pagination?: PaginatedResponseDto;
}
