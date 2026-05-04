import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class TransactionItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
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
