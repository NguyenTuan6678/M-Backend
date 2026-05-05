import { Expose, Transform } from 'class-transformer';

export class SaleTransactionResponseDTO {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString())
  _id: string;

  @Expose()
  invoiceNumber: string;

  @Expose()
  customerName: string;

  @Expose()
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];

  @Expose()
  totalAmount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
