import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { AlertService } from '@common/alerts/alert.service';

@Injectable()
export class InvoiceMonitorService {
  private readonly logger = new Logger(InvoiceMonitorService.name);
  private lastExistingFailedAlertAt: Date | null = null;

  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly alertService: AlertService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async monitorInvoices() {
    this.logger.log('[INVOICE MONITOR] Start checking invoice health');
    await this.checkAndFailStuckIssuingInvoices();
    await this.checkFailedInvoicesRecently();
    await this.checkExistingFailedInvoices();
    await this.checkInconsistentInvoices();

    this.logger.log('[INVOICE MONITOR] Finished checking invoice health');
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

  private async checkExistingFailedInvoices() {
    const enabled =
      process.env.INVOICE_EXISTING_FAILED_ALERT_ENABLED === 'true';

    if (!enabled) {
      this.logger.log(
        '[INVOICE MONITOR] Existing FAILED invoice alert disabled',
      );
      return;
    }

    const cooldownMinutes = Number(
      process.env.INVOICE_EXISTING_FAILED_ALERT_COOLDOWN_MINUTES ?? 30,
    );

    if (this.lastExistingFailedAlertAt) {
      const diffMs = Date.now() - this.lastExistingFailedAlertAt.getTime();
      const diffMinutes = diffMs / 1000 / 60;

      if (diffMinutes < cooldownMinutes) {
        this.logger.log(
          `[INVOICE MONITOR] Existing FAILED invoice alert skipped by cooldown: ${diffMinutes.toFixed(
            1,
          )}/${cooldownMinutes} minutes`,
        );
        return;
      }
    }

    const failedInvoices =
      await this.saleTransactionRepository.findExistingFailedInvoices(20);

    if (!failedInvoices.length) {
      this.logger.log('[INVOICE MONITOR] No existing FAILED invoices');
      return;
    }

    await this.alertService.notifyExistingFailedInvoices({
      count: failedInvoices.length,
      invoices: failedInvoices.map((invoice: any) => ({
        id: String(invoice._id),
        orderNumber: invoice.orderNumber,
        buyerName: invoice.inv_buyerDisplayName,
        buyerTaxCode: invoice.inv_buyerTaxCode,
        updatedAt: invoice.updatedAt,
        invoiceStatus: invoice.invoiceStatus,
      })),
    });

    this.lastExistingFailedAlertAt = new Date();
  }

  private async checkAndFailStuckIssuingInvoices() {
    const timeoutMinutes = Number(
      process.env.INVOICE_JOB_TIMEOUT_MINUTES ?? 10,
    );

    const result =
      await this.saleTransactionRepository.markStuckIssuingInvoicesFailed(
        timeoutMinutes,
      );

    if (result.updated === 0) {
      this.logger.log(
        `[INVOICE MONITOR] No stuck ISSUING invoices older than ${timeoutMinutes} minutes`,
      );
      return;
    }

    this.logger.warn(
      `[INVOICE MONITOR] Marked ${result.updated}/${result.matched} stuck ISSUING invoices as FAILED`,
    );

    await this.alertService.sendInvoiceAlert(
      [
        '🚨 [INVOICE ALERT] Stuck ISSUING invoices marked as FAILED',
        `Timeout: ${timeoutMinutes} minutes`,
        `Updated: ${result.updated}/${result.matched}`,
        '',
        ...result.invoices.map((invoice, index) =>
          [
            `${index + 1}. Order: ${invoice.orderNumber ?? 'N/A'}`,
            `ID: ${invoice.id}`,
            `Buyer: ${invoice.inv_buyerDisplayName ?? 'N/A'}`,
            `UpdatedAt: ${invoice.updatedAt?.toISOString?.() ?? 'N/A'}`,
          ].join('\n'),
        ),
      ].join('\n'),
    );
  }
}
