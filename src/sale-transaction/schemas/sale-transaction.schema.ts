import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class SalesTransaction {
  @Prop()
  activationDate: Date; // Ngày kích hoạt

  @Prop({ type: Types.ObjectId, ref: 'Agency' })
  agencyId: string; // Đại lý

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: string; // Phòng ban

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  employeeId: string; // NVKD

  @Prop()
  taxCode: string; // MST

  @Prop()
  companyName: string;

  @Prop()
  email: string;

  @Prop()
  address: string;

  @Prop({ default: false })
  isPaid: boolean; // Đã thu tiền

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
