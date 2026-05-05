import { Expose } from 'class-transformer';

export class TransactionItemDto {
  @Expose()
  productId: string;

  @Expose()
  price: number;

  @Expose()
  taxRate: number;

  @Expose()
  quantity: number;

  @Expose()
  total: number;
}
