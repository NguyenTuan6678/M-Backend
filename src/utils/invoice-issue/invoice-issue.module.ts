import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';
import { InvoiceQueueModule } from '../../api/queues/invoice-queue.module';
import { InvoiceIssueService } from './invoice-issue.service';
import { forwardRef, Module } from '@nestjs/common';
import { AuditLogModule } from '@common/audit/audit-log.module';

@Module({
  imports: [
    SaleTransactionModule,
    AuditLogModule,
    forwardRef(() => InvoiceQueueModule),
  ],
  providers: [InvoiceIssueService],
  exports: [InvoiceIssueService],
})
export class InvoiceIssueModule {}
