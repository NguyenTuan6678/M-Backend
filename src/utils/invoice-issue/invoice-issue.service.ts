import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceQueueService } from '../../api/queues/invoice-queue.service';
import { InvoiceStatus } from '@utils/transaction-status';
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

    /**
     * Nếu hóa đơn đã xuất rồi thì không enqueue lại.
     */
    if ((transaction as any).inv_invoiceCreatedId) {
      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Invoice already issued',
        content: transaction,
      };
    }

    /**
     * Nếu đang ISSUING:
     * - Nếu chưa quá timeout thì báo đang xử lý
     * - Nếu quá timeout thì set FAILED để cho phép enqueue lại
     */
    if ((transaction as any).invoiceStatus === InvoiceStatus.ISSUING) {
      const updatedAt = new Date((transaction as any).updatedAt).getTime();
      const now = Date.now();

      const timeoutMinutes = Number(
        process.env.INVOICE_JOB_TIMEOUT_MINUTES ?? 10,
      );

      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (now - updatedAt < timeoutMs) {
        return {
          code: ERROR_RES.ACCEPTED.statusCode,
          info: ERROR_INFO.PROCESSING,
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
      /**
       * Validate data quan trọng trước khi enqueue.
       */
      if (!body.tax_code) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'tax_code is required',
        };
      }

      if (!body.inv_invoiceSeries) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'inv_invoiceSeries is required',
        };
      }

      /**
       * Set ISSUING trước khi add job.
       */
      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: InvoiceStatus.ISSUING,
        isActive: true,
      });

      /**
       * addInvoiceJob hiện tại trả về object response,
       * không phải BullMQ Job object.
       */
      const queuedResult = await this.invoiceQueueService.addInvoiceJob({
        saleTransactionId,
        tax_code: body.tax_code,
        inv_invoiceSeries: body.inv_invoiceSeries,
        inv_invoiceIssuedDate: body.inv_invoiceIssuedDate,
        editmode: body.editmode,
      });

      return queuedResult;
    } catch (error: any) {
      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: InvoiceStatus.FAILED,
        isActive: true,
      });

      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Failed to queue invoice job: ${error.message}`,
      };
    }
  }
}
