import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Department } from './department.schema';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ unique: true })
  employeeNumber: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ unique: true })
  employeeEmail?: string;

  @Prop({ unique: true })
  employeePhone?: string;

  @Prop({ type: Types.ObjectId, ref: Department.name })
  departmentId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
