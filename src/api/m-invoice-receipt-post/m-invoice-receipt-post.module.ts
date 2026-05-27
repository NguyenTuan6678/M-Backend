import { forwardRef, Module } from '@nestjs/common';
import { MInvoiceReceiptPostService } from './m-invoice-receipt-post.service';
import { MInvoiceReceiptPostController } from './m-invoice-receipt-post.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionSchema,
} from '@schemas/sale-transaction.schema';
import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';
import { ReceiptInvoiceModule } from '@module/receiptinvoice/receiptinvoice.module';
import { InvoiceIssueModule } from '@utils/invoice-issue/invoice-issue.module';
import { InvoiceQueueModule } from '../queues/invoice-queue.module';

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
    ReceiptInvoiceModule,
    InvoiceQueueModule,
    forwardRef(() => InvoiceIssueModule),
  ],
  providers: [MInvoiceReceiptPostService],
  controllers: [MInvoiceReceiptPostController],
  exports: [MInvoiceReceiptPostService],
})
export class MInvoiceReceiptPostModule {}
