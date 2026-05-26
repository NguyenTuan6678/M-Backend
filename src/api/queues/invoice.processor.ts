import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MInvoiceReceiptPostService } from '../m-invoice-receipt-post/m-invoice-receipt-post.service';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceStatus } from '@utils/transaction-status';

const INVOICE_WORKER_CONCURRENCY = Number(
  process.env.INVOICE_WORKER_CONCURRENCY ?? 5,
);

@Processor('invoice', {
  concurrency: INVOICE_WORKER_CONCURRENCY,
})
@Injectable()
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    private readonly mInvoiceReceiptPostService: MInvoiceReceiptPostService,
    private readonly saleTransactionRepository: SaleTransactionRepository,
  ) {
    super();
  }

  async process(job: Job) {
    const saleTransactionId = job.data?.saleTransactionId;
    const timeoutMs = this.getJobTimeoutMs();

    this.logger.log(`[INVOICE JOB START] ${job.id}`);
    this.logger.log(`[INVOICE JOB DATA] ${JSON.stringify(job.data)}`);

    try {
      if (!saleTransactionId) {
        throw new Error('Missing saleTransactionId in invoice job data');
      }

      /**
       * Nếu job nằm chờ trong queue quá lâu thì không xử lý nữa.
       * Ví dụ: FE bắn nhiều hóa đơn, job thứ sau nằm waiting > 10 phút.
       */
      const waitingMs = Date.now() - job.timestamp;

      if (waitingMs > timeoutMs) {
        throw new Error(
          `Invoice issue job expired before processing. Waiting time: ${Math.round(
            waitingMs / 1000,
          )}s`,
        );
      }

      const result = await this.runWithTimeout<any>(
        this.mInvoiceReceiptPostService.processCreateInvoice(
          job.data.tax_code,
          job.data.saleTransactionId,
          job.data.inv_invoiceSeries,
          job.data.inv_invoiceIssuedDate,
          job.data.editmode,
        ),
        timeoutMs,
      );

      if (this.isInvoiceResultFailed(result)) {
        throw new Error(
          result?.message ||
            result?.error ||
            'Invoice issue failed without error message',
        );
      }

      this.logger.log(`[INVOICE JOB DONE] ${job.id}`);
      this.logger.log(`[INVOICE JOB RESULT] ${JSON.stringify(result)}`);

      return result;
    } catch (error: any) {
      await this.markTransactionFailed(
        saleTransactionId,
        error?.message || 'Invoice job failed',
      );

      this.logger.error(
        `[INVOICE JOB FAILED] ${job.id} - ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  private getJobTimeoutMs(): number {
    const timeoutMinutes = Number(
      process.env.INVOICE_JOB_TIMEOUT_MINUTES ?? 10,
    );

    return timeoutMinutes * 60 * 1000;
  }

  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Invoice issue job timeout after ${Math.round(
                timeoutMs / 1000 / 60,
              )} minutes`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  }

  private isInvoiceResultFailed(result: any): boolean {
    if (!result) return true;

    if (result.ok === false) return true;

    if (
      result.code &&
      result.code !== '00' &&
      result.code !== 200 &&
      result.code !== 201
    ) {
      return true;
    }

    return false;
  }

  private async markTransactionFailed(
    saleTransactionId: string | undefined,
    reason: string,
  ) {
    if (!saleTransactionId) return;

    await this.saleTransactionRepository.update(saleTransactionId, {
      invoiceStatus: InvoiceStatus.FAILED,
    });

    this.logger.warn(
      `[INVOICE JOB FAILED STATUS UPDATED] transaction=${saleTransactionId}, reason=${reason}`,
    );
  }
}
