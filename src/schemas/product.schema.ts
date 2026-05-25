import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ unique: true })
  inv_itemCode: string;

  @Prop({ required: true, unique: true })
  inv_itemName: string;

  @Prop()
  inv_unitCode: string;

  @Prop()
  inv_unitPrice: number;

  @Prop({ required: true })
  ma_thue: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  inv_quantity: number;

  @Prop({ default: 0 })
  inv_discountAmount: number;

  @Prop({ default: 0 })
  inv_TotalAmountWithoutVat: number;

  @Prop({ default: 0 })
  inv_vatAmount: number;

  @Prop({ default: 0 })
  inv_TotalAmount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
