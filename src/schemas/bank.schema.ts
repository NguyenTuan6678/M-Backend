import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BankDocument = Bank & Document;

@Schema({ timestamps: true })
export class Bank {
  @Prop({ required: true })
  inv_buyerBankName: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
