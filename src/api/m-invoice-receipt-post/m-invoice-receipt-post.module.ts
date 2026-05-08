import { Module } from '@nestjs/common';
import { MInvoiceReceiptPostService } from './m-invoice-receipt-post.service';
import { MInvoiceReceiptPostController } from './m-invoice-receipt-post.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionSchema,
} from '@schemas/sale-transaction.schema';
import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      {
        name: SalesTransaction.name,
        schema: SalesTransactionSchema,
      },
    ]),
    SaleTransactionModule,
  ],
  providers: [MInvoiceReceiptPostService],
  controllers: [MInvoiceReceiptPostController],
})
export class MInvoiceReceiptPostModule {}
