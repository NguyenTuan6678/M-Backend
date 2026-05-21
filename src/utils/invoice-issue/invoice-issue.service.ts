import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceQueueService } from '../../api/queues/invoice-queue.service';
import { InvoiceStatus } from '@utils/transaction-status';

@Injectable()
export class InvoiceIssueService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly invoiceQueueService: InvoiceQueueService,
  ) {}

  async enqueueIssueInvoice(
    saleTransactionId: string,
    body: {
      tax_code: string;
      inv_invoiceSeries: string;
      inv_invoiceIssuedDate?: string;
      editmode?: number;
    },
  ) {
    const transaction =
      await this.saleTransactionRepository.findById(saleTransactionId);

    if (!transaction) {
      return {
        code: 404,
        info: 'FAIL',
        message: 'Sale transaction not found',
      };
    }

    if ((transaction as any).inv_invoiceCreatedId) {
      return {
        code: 200,
        info: 'SUCCESS',
        message: 'Invoice already issued',
        content: transaction,
      };
    }

    if ((transaction as any).invoiceStatus === InvoiceStatus.ISSUING) {
      const updatedAt = new Date((transaction as any).updatedAt).getTime();
      const now = Date.now();
      const timeoutMs = 5 * 60 * 1000;

      if (now - updatedAt < timeoutMs) {
        return {
          code: 202,
          info: 'PROCESSING',
          message: 'Invoice is already being issued',
          content: transaction,
        };
      }

      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: InvoiceStatus.FAILED,
        isActive: true,
      });
    }

    try {
      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: 'ISSUING' as any,
        isActive: true,
      });

      const job = await this.invoiceQueueService.addIssueInvoiceJob({
        saleTransactionId,
        tax_code: body.tax_code,
        inv_invoiceSeries: body.inv_invoiceSeries,
        inv_invoiceIssuedDate: body.inv_invoiceIssuedDate,
        editmode: body.editmode,
      });

      return {
        code: 202,
        info: 'PROCESSING',
        message: 'Invoice issue job has been queued',
        jobId: job.id,
        saleTransactionId,
      };
    } catch (error: any) {
      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: 'FAILED' as any,
        isActive: true,
      });

      return {
        code: 500,
        info: 'FAIL',
        message: `Failed to queue invoice job: ${error.message}`,
      };
    }
  }
}
