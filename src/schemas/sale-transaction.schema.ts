import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Agency } from './agency.schema';
import { Department } from './department.schema';
import { Employee } from './employee.schema';
import { Bank } from './bank.schema';
import { Product } from './product.schema';
import { InvoiceStatus } from '@utils/transaction-status';

export type SalesTransactionDocument = SalesTransaction & Document;

export class TransactionItem {
  @Prop({ type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;

  @Prop()
  revenue: number;

  @Prop()
  capitalPrice: number;

  @Prop()
  totalSalary: number;

  @Prop()
  accountingAccountCode: number;
}

@Schema({ timestamps: true })
export class SalesTransaction {
  @Prop({ default: null })
  activationDate: string;

  @Prop({ default: null })
  inv_invoiceCreatedId: string;

  @Prop()
  inv_invoiceSeries: string;

  @Prop()
  inv_invoiceIssuedDate: string;

  @Prop()
  inv_currencyCode: string;

  @Prop()
  inv_exchangeRate: number;

  @Prop({ unique: true })
  orderNumber: string;

  @Prop()
  so_benh_an: string;

  @Prop()
  inv_buyerDisplayName: string;

  @Prop()
  inv_buyerLegalName: string;

  @Prop()
  inv_buyerTaxCode: string;

  @Prop()
  inv_buyerAddressLine: string;

  @Prop()
  inv_buyerEmail: string;

  @Prop()
  inv_buyerBankAccount: string;

  @Prop()
  inv_buyerBankName: string;

  @Prop()
  inv_paymentMethodName: string;

  @Prop()
  inv_discountAmount: number;

  @Prop()
  inv_TotalAmountWithoutVAT: number;

  @Prop()
  inv_vatAmount: number;

  @Prop()
  inv_TotalAmount: number;

  @Prop()
  key_api: string;

  @Prop()
  cccdan: string;

  @Prop()
  so_hchieu: string;

  @Prop()
  mdvqhnsach_nmua: string;

  @Prop()
  ma_ch: string;

  @Prop()
  ten_ch: string;

  @Prop()
  inv_quantity: number;

  @Prop()
  inv_discountPercentage: number;

  @Prop({ type: Types.ObjectId, ref: Agency.name, required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Department.name })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Employee.name })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Bank.name })
  bankId?: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: Product.name },
        revenue: Number,
        capitalPrice: Number,
        totalSalary: Number,
        accountingAccountCode: Number,
      },
    ],
  })
  items: TransactionItem[];

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  invoiceStatus: InvoiceStatus;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const SalesTransactionSchema =
  SchemaFactory.createForClass(SalesTransaction);
