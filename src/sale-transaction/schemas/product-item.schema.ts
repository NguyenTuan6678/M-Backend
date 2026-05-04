import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  code: string; // Mã SP

  @Prop({ required: true })
  name: string; // Tên SP

  @Prop({ required: true })
  price: number; // Đơn giá

  @Prop({ required: true })
  taxRate: number; // Thuế suất (%)

  @Prop()
  accountCode?: string; // Mã tài khoản hạch toán

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
