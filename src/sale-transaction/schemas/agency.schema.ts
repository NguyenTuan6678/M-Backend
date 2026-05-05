import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Agency {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  commissionPercent: number;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);
