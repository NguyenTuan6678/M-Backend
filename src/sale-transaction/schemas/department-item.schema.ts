import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  code: string; // Mã phòng ban

  @Prop({ required: true })
  name: string; // Tên phòng ban

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
