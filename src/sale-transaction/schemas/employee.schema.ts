import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  email?: string;

  @Prop({ unique: true })
  phone?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
