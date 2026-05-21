import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IssueInvoiceJob } from './invoice-job.type';

@Injectable()
export class InvoiceQueueService {
  constructor(
    @InjectQueue('invoice')
    private readonly invoiceQueue: Queue<IssueInvoiceJob>,
  ) {}

  async addIssueInvoiceJob(data: IssueInvoiceJob) {
    console.log('[ADD INVOICE JOB] data:', data);

    const job = await this.invoiceQueue.add('issue-invoice', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: {
        age: 60 * 60 * 24,
        count: 1000,
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 7,
      },

      // Tạm thời dùng Date.now để tránh duplicate jobId khi debug
      jobId: `issue-invoice:${data.saleTransactionId}:${Date.now()}`,
    });

    console.log('[ADD INVOICE JOB SUCCESS]', {
      id: job.id,
      name: job.name,
      data: job.data,
    });

    return job;
  }
}
