import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
