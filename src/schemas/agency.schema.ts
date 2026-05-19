import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from './employee.schema';

export type AgencyDocument = Agency & Document;

@Schema({ timestamps: true })
export class Agency {
  @Prop({ unique: true })
  agencyNumber: string;

  @Prop({ required: true, unique: true })
  agencyName: string;

  @Prop({ required: true, unique: true })
  agencyEmail: string;

  @Prop({ required: true })
  commissionPercent: number;

  @Prop({ type: Types.ObjectId, ref: Employee.name })
  employeeId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);
