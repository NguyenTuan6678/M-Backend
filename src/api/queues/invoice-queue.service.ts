import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class InvoiceQueueService {
  constructor(
    @InjectQueue('invoice')
    private readonly invoiceQueue: Queue,
  ) {}

  async addInvoiceJob(data: {
    saleTransactionId: string;
    tax_code: string;
    inv_invoiceSeries?: string;
    inv_invoiceIssuedDate?: string;
    editmode?: number;
  }) {
    const attempts = Number(process.env.INVOICE_JOB_ATTEMPTS ?? 3);

    const job = await this.invoiceQueue.add('issue-invoice', data, {
      jobId: `issue-invoice:${data.saleTransactionId}:${Date.now()}`,

      attempts,

      backoff: {
        type: 'exponential',
        delay: 5000,
      },

      removeOnComplete: {
        age: 60 * 60,
        count: 1000,
      },

      removeOnFail: {
        age: 24 * 60 * 60,
        count: 5000,
      },
    });

    return {
      code: 202,
      info: 'PROCESSING',
      message: 'Invoice issue job has been queued',
      jobId: job.id,
      saleTransactionId: data.saleTransactionId,
    };
  }
}
