import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';

@Injectable()
export class InvoiceQueueService {
  constructor(
    @InjectQueue('invoice')
    private readonly invoiceQueue: Queue,

    private readonly saleTransactionRepository: SaleTransactionRepository,
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
      invoiceStatus: 'ISSUING',
      statusCheckUrl: `/m-invoice-receipt-post/job-status?jobId=${encodeURIComponent(
        String(job.id),
      )}`,
      successCondition:
        'invoiceStatus=ISSUED and inv_invoiceCreatedId is not empty',
    };
  }

  async getInvoiceJobStatus(jobId: string) {
    const job = await this.invoiceQueue.getJob(jobId);

    const parsedSaleTransactionId =
      this.extractSaleTransactionIdFromJobId(jobId);

    if (!job) {
      const transaction = parsedSaleTransactionId
        ? await this.saleTransactionRepository.findById(parsedSaleTransactionId)
        : null;

      return {
        code: 200,
        info: 'SUCCESS',
        message:
          'Job not found in queue. It may have been removed, but transaction status is returned if available.',
        jobId,
        jobState: 'REMOVED_OR_NOT_FOUND',
        saleTransactionId: parsedSaleTransactionId,
        invoiceStatus: (transaction as any)?.invoiceStatus ?? null,
        inv_invoiceCreatedId:
          (transaction as any)?.inv_invoiceCreatedId ?? null,
        isSuccess:
          (transaction as any)?.invoiceStatus === 'ISSUED' &&
          !!(transaction as any)?.inv_invoiceCreatedId,
        isFailed: (transaction as any)?.invoiceStatus === 'FAILED',
      };
    }

    const state = await job.getState();
    const saleTransactionId =
      job.data?.saleTransactionId || parsedSaleTransactionId;

    const transaction = saleTransactionId
      ? await this.saleTransactionRepository.findById(saleTransactionId)
      : null;

    const invoiceStatus = (transaction as any)?.invoiceStatus ?? null;
    const invInvoiceCreatedId =
      (transaction as any)?.inv_invoiceCreatedId ?? null;

    return {
      code: 200,
      info: 'SUCCESS',
      message: 'Invoice job status fetched successfully',

      jobId: job.id,
      jobName: job.name,
      jobState: state,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason || null,
      stacktrace: job.stacktrace || [],

      saleTransactionId,
      invoiceStatus,
      inv_invoiceCreatedId: invInvoiceCreatedId,
      inv_invoiceSeries: (transaction as any)?.inv_invoiceSeries ?? null,
      inv_invoiceIssuedDate:
        (transaction as any)?.inv_invoiceIssuedDate ?? null,
      orderNumber: (transaction as any)?.orderNumber ?? null,

      isProcessing:
        state === 'waiting' ||
        state === 'delayed' ||
        state === 'active' ||
        invoiceStatus === 'ISSUING',

      isSuccess: invoiceStatus === 'ISSUED' && !!invInvoiceCreatedId,

      isFailed: state === 'failed' || invoiceStatus === 'FAILED',
    };
  }

  private extractSaleTransactionIdFromJobId(jobId: string): string | undefined {
    const parts = jobId.split(':');

    if (parts.length >= 3 && parts[0] === 'issue-invoice') {
      return parts[1];
    }

    return undefined;
  }
}
