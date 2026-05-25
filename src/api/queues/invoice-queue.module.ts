import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoiceQueueService } from './invoice-queue.service';
import { InvoiceProcessor } from './invoice.processor';
import { MInvoiceReceiptPostModule } from '../m-invoice-receipt-post/m-invoice-receipt-post.module';
import { LoggerService } from '@common/logs/logger.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invoice',
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    forwardRef(() => MInvoiceReceiptPostModule),
  ],
  providers: [InvoiceQueueService, InvoiceProcessor, LoggerService],
  exports: [InvoiceQueueService],
})
export class InvoiceQueueModule {}
