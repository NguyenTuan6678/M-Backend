import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionItemDocument = TransactionItem & Document;

@Schema({ timestamps: true })
export class TransactionItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: string;

  @Prop()
  price: number;

  @Prop()
  taxRate: number;

  @Prop()
  quantity: number;

  @Prop()
  total: number;
}

export const TransactionItemSchema =
  SchemaFactory.createForClass(TransactionItem);
