import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IssueInvoiceJob } from './invoice-job.type';
import { MInvoiceReceiptPostService } from '../m-invoice-receipt-post/m-invoice-receipt-post.service';
import { forwardRef, Inject } from '@nestjs/common';

@Processor('invoice', {
  concurrency: 3,
})
export class InvoiceProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => MInvoiceReceiptPostService))
    private readonly mInvoiceReceiptPostService: MInvoiceReceiptPostService,
  ) {
    super();
  }

  async process(job: Job<IssueInvoiceJob>): Promise<any> {
    if (job.name !== 'issue-invoice') {
      return;
    }

    const {
      tax_code,
      saleTransactionId,
      inv_invoiceSeries,
      inv_invoiceIssuedDate,
      editmode,
    } = job.data;

    return await this.mInvoiceReceiptPostService.processCreateInvoice(
      tax_code,
      saleTransactionId,
      inv_invoiceSeries,
      inv_invoiceIssuedDate,
      editmode,
    );
  }
}
