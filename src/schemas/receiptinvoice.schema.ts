import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReceiptInvoiceDocument = ReceiptInvoice & Document;

@Schema({ timestamps: true })
export class ReceiptInvoice {
  @Prop({ required: true })
  inv_invoiceSeries: string;

  @Prop({ required: true })
  tax_code: string;
}

export const ReceiptInvoiceSchema =
  SchemaFactory.createForClass(ReceiptInvoice);
