import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';
// import { InvoiceQueueModule } from '../../api/queues/invoice-queue.module';
import { InvoiceIssueService } from './invoice-issue.service';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [
    SaleTransactionModule,
    // forwardRef(() => InvoiceQueueModule)
  ],
  providers: [InvoiceIssueService],
  exports: [InvoiceIssueService],
})
export class InvoiceIssueModule {}
