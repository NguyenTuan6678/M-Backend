import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { AlertService } from '@common/alerts/alert.service';

@Injectable()
export class InvoiceMonitorService {
  private readonly logger = new Logger(InvoiceMonitorService.name);

  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly alertService: AlertService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async monitorInvoices() {
    this.logger.log('[INVOICE MONITOR] Start checking invoice health');

    await this.checkStuckIssuingInvoices();
    await this.checkFailedInvoicesRecently();
    await this.checkInconsistentInvoices();

    this.logger.log('[INVOICE MONITOR] Finished checking invoice health');
  }

  private async checkStuckIssuingInvoices() {
    const stuckMinutes = Number(process.env.INVOICE_STUCK_MINUTES ?? 10);

    const stuckInvoices =
      await this.saleTransactionRepository.findStuckIssuingInvoices(
        stuckMinutes,
      );

    if (!stuckInvoices.length) {
      this.logger.log('[INVOICE MONITOR] No stuck ISSUING invoices');
      return;
    }

    await this.alertService.notifyStuckIssuingInvoices({
      count: stuckInvoices.length,
      stuckMinutes,
      invoices: stuckInvoices.map((invoice: any) => ({
        id: String(invoice._id),
        orderNumber: invoice.orderNumber,
        buyerName: invoice.inv_buyerDisplayName,
        updatedAt: invoice.updatedAt,
        invoiceStatus: invoice.invoiceStatus,
      })),
    });
  }

  private async checkFailedInvoicesRecently() {
    const threshold = Number(process.env.INVOICE_FAILED_THRESHOLD ?? 5);
    const windowMinutes = Number(
      process.env.INVOICE_FAILED_WINDOW_MINUTES ?? 10,
    );

    const failedCount =
      await this.saleTransactionRepository.countFailedInvoicesRecently(
        windowMinutes,
      );

    if (failedCount < threshold) {
      this.logger.log(
        `[INVOICE MONITOR] FAILED invoices recently: ${failedCount}/${threshold}`,
      );
      return;
    }

    await this.alertService.notifyTooManyFailedInvoices({
      count: failedCount,
      threshold,
      windowMinutes,
    });
  }

  private async checkInconsistentInvoices() {
    const issuedWithoutCreatedIdCount =
      await this.saleTransactionRepository.countIssuedWithoutCreatedId();

    const createdIdButNotIssuedCount =
      await this.saleTransactionRepository.countCreatedIdButNotIssued();

    if (issuedWithoutCreatedIdCount === 0 && createdIdButNotIssuedCount === 0) {
      this.logger.log('[INVOICE MONITOR] No inconsistent invoice status');
      return;
    }

    await this.alertService.notifyInconsistentInvoices({
      issuedWithoutCreatedIdCount,
      createdIdButNotIssuedCount,
    });
  }
}
