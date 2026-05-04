import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Agency {
  @Prop()
  code: string;

  @Prop()
  name: string;

  @Prop()
  commissionPercent: number;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);
