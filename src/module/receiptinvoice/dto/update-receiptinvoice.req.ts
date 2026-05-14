import { PartialType } from '@nestjs/mapped-types';
import { CreateReceiptInvoiceDto } from './create-receiptinvoice.req';

export class UpdateReceiptInvoice extends PartialType(
  CreateReceiptInvoiceDto,
) {}
