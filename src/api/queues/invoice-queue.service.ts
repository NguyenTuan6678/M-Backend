import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';

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
      code: ERROR_RES.ACCEPTED.statusCode,
      info: ERROR_INFO.PROCESSING,
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
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
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

    const normalizedError = this.normalizeInvoiceJobError({
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
    });
    const saleTransactionId =
      job.data?.saleTransactionId || parsedSaleTransactionId;

    const transaction = saleTransactionId
      ? await this.saleTransactionRepository.findById(saleTransactionId)
      : null;

    const invoiceStatus = (transaction as any)?.invoiceStatus ?? null;
    const invInvoiceCreatedId =
      (transaction as any)?.inv_invoiceCreatedId ?? null;

    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
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

      invoiceErrorCode:
        state === 'failed' || invoiceStatus === 'FAILED'
          ? normalizedError.errorCode
          : null,

      invoiceErrorMessage:
        state === 'failed' || invoiceStatus === 'FAILED'
          ? normalizedError.errorMessage
          : null,

      rawFailedReason:
        state === 'failed' || invoiceStatus === 'FAILED'
          ? normalizedError.rawError
          : null,

      isProcessing:
        state === 'waiting' ||
        state === 'delayed' ||
        state === 'active' ||
        invoiceStatus === 'ISSUING',

      isSuccess: invoiceStatus === 'ISSUED' && !!invInvoiceCreatedId,

      isFailed: state === 'failed' || invoiceStatus === 'FAILED',
    };
  }

  private normalizeInvoiceJobError(params: {
    failedReason?: string | null;
    stacktrace?: string[] | null;
  }) {
    const rawError =
      params.failedReason ||
      params.stacktrace?.find((line) =>
        line.includes('Create invoice fail because date'),
      ) ||
      params.stacktrace?.[0] ||
      '';

    const lower = rawError.toLowerCase();

    if (
      lower.includes('date') &&
      lower.includes('use with other invoice before')
    ) {
      return {
        errorCode: 'INVALID_INVOICE_DATE',
        errorMessage:
          'Ngày xuất hóa đơn không hợp lệ hoặc đã được sử dụng với hóa đơn khác.',
        rawError: rawError.split('\n')[0].replace('Error: ', ''),
      };
    }

    if (lower.includes('timeout')) {
      return {
        errorCode: 'INVOICE_JOB_TIMEOUT',
        errorMessage: 'Quá thời gian xử lý hóa đơn. Vui lòng thử lại sau.',
        rawError: rawError.split('\n')[0].replace('Error: ', ''),
      };
    }

    if (lower.includes('already failed')) {
      return {
        errorCode: 'TRANSACTION_ALREADY_FAILED',
        errorMessage: 'Hóa đơn đã ở trạng thái lỗi trước đó.',
        rawError: rawError.split('\n')[0].replace('Error: ', ''),
      };
    }

    return {
      errorCode: 'UNKNOWN_INVOICE_ERROR',
      errorMessage:
        rawError.split('\n')[0].replace('Error: ', '') ||
        'Xuất hóa đơn thất bại.',
      rawError: rawError.split('\n')[0].replace('Error: ', ''),
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
