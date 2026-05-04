import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Bank {
  @Prop({ required: true, unique: true })
  code: string; // Mã ngân hàng

  @Prop({ required: true })
  name: string; // Tên ngân hàng

  @Prop()
  accountNumber?: string;

  @Prop()
  accountName?: string;

  @Prop()
  branch?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
