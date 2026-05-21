import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoiceQueueService } from './invoice-queue.service';
import { InvoiceProcessor } from './invoice.processor';
import { MInvoiceReceiptPostModule } from '../m-invoice-receipt-post/m-invoice-receipt-post.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invoice',
    }),
    forwardRef(() => MInvoiceReceiptPostModule),
  ],
  providers: [InvoiceQueueService, InvoiceProcessor],
  exports: [InvoiceQueueService],
})
export class InvoiceQueueModule {}
