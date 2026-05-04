import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true, unique: true })
  code: string; // Mã nhân viên

  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department' })
  departmentId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
