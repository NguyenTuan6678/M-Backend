import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Bank {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  accountNumber?: string;

  @Prop({ required: true })
  accountName?: string;

  @Prop({ required: true })
  branch?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
