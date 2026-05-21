import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceQueueService } from '../../api/queues/invoice-queue.service';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';

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
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'Sale transaction not found',
      };
    }

    if ((transaction as any).invoiceStatus === 'ISSUED') {
      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Invoice already issued',
        content: transaction,
      };
    }

    if ((transaction as any).invoiceStatus === 'ISSUING') {
      return {
        code: 202,
        info: 'PROCESSING',
        message: 'Invoice is already being issued',
        content: transaction,
      };
    }

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
  }
}
