import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MInvoiceReceiptPostService } from '../m-invoice-receipt-post/m-invoice-receipt-post.service';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceStatus } from '@utils/transaction-status';
import { AuditLogService } from '@common/audit/audit-log.service';
import { AuditAction } from '@common/audit/audit-action.enum';

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
    private readonly auditLogService: AuditLogService,
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

      const currentTransaction =
        await this.saleTransactionRepository.findById(saleTransactionId);

      if (!currentTransaction) {
        throw new Error(`Sale transaction ${saleTransactionId} not found`);
      }

      if ((currentTransaction as any).invoiceStatus === InvoiceStatus.FAILED) {
        throw new Error(
          `Invoice job skipped because transaction is already FAILED: Id(${saleTransactionId})`,
        );
      }

      if ((currentTransaction as any).inv_invoiceCreatedId) {
        this.logger.log(
          `[INVOICE JOB SKIPPED] Invoice already created for transaction = ${saleTransactionId}`,
        );

        return {
          ok: true,
          message: 'Invoice already created',
          saleTransactionId,
        };
      }

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
      // this.logger.log(`[INVOICE JOB RESULT] ${JSON.stringify(result)}`);

      await this.auditLogService.log({
        actor: job.data.actor,
        action: AuditAction.ISSUE_INVOICE_SUCCESS,
        resource: 'SaleTransaction',
        resourceId: saleTransactionId,
        metadata: {
          jobId: job.id,
          invoiceNumber: result?.data?.inv_invoiceNumber || result?.data?.shdon,
          inv_invoiceCreatedId: result?.data?.id,
          message: result?.message,
        },
      });

      return result;
    } catch (error: any) {
      await this.markTransactionFailed(
        saleTransactionId,
        error?.message || 'Invoice job failed',
      );

      await this.auditLogService.log({
        actor: job.data?.actor,
        action: AuditAction.ISSUE_INVOICE_FAILED,
        resource: 'SaleTransaction',
        resourceId: saleTransactionId,
        metadata: {
          jobId: job.id,
          tax_code: job.data?.tax_code,
          error: error?.message || 'Invoice job failed',
        },
      });

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
      `[INVOICE JOB FAILED STATUS UPDATED] transaction = ${saleTransactionId}, reason = ${reason}`,
    );
  }
}
