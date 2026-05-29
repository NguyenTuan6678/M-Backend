import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { InvoiceQueueService } from '../../api/queues/invoice-queue.service';
import { InvoiceStatus } from '@utils/transaction-status';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { AuditLogService } from '@common/audit/audit-log.service';
import { Role } from '@utils/role.enum';
import { AuditAction } from '@common/audit/audit-action.enum';

@Injectable()
export class InvoiceIssueService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly invoiceQueueService: InvoiceQueueService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async enqueueIssueInvoice(
    saleTransactionId: string,
    body: {
      tax_code: string;
      inv_invoiceSeries: string;
      inv_invoiceIssuedDate?: string;
      editmode?: number;
    },
    audit?: {
      actor?: { id: string; username: string; role: Role };
      ip?: string;
      userAgent?: string;
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

    if ((transaction as any).inv_invoiceCreatedId) {
      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Invoice already issued',
        content: transaction,
      };
    }

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

      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: InvoiceStatus.ISSUING,
        isActive: true,
      });

      const queuedResult = await this.invoiceQueueService.addInvoiceJob({
        saleTransactionId,
        tax_code: body.tax_code,
        inv_invoiceSeries: body.inv_invoiceSeries,
        inv_invoiceIssuedDate: body.inv_invoiceIssuedDate,
        editmode: body.editmode,

        actor: audit?.actor,
      });

      await this.auditLogService.log({
        actor: audit?.actor,
        action: AuditAction.ISSUE_INVOICE_QUEUED,
        resource: 'SaleTransaction',
        resourceId: saleTransactionId,
        metadata: {
          jobId: queuedResult.jobId,
          tax_code: body.tax_code,
          inv_invoiceSeries: body.inv_invoiceSeries,
          inv_invoiceIssuedDate: body.inv_invoiceIssuedDate,
        },
        ip: audit?.ip,
        userAgent: audit?.userAgent,
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
