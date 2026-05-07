import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  inv_itemCode: string;

  @Prop()
  inv_itemName: string;

  @Prop()
  inv_unitCode: string;

  @Prop()
  inv_unitPrice: number;

  @Prop()
  ma_thue: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
