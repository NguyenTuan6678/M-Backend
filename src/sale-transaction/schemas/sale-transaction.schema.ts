import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SalesTransactionDocument = SalesTransaction & Document;

@Schema({ timestamps: true })
export class SalesTransaction {
  @Prop()
  activationDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Agency' })
  agencyId: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  employeeId: string;

  @Prop()
  taxCode: string;

  @Prop()
  companyName: string;

  @Prop()
  email: string;

  @Prop()
  address: string;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAmount: number;

  @Prop()
  paidDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Bank' })
  bankId: string;

  @Prop({ type: Types.ObjectId, ref: 'TransactionItem' })
  items: string[];
}

export const SalesTransactionSchema =
  SchemaFactory.createForClass(SalesTransaction);
