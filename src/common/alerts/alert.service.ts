import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly httpService: HttpService) {}

  private isDiscordEnabled(): boolean {
    return process.env.ALERT_DISCORD_ENABLED === 'true';
  }

  private isTelegramEnabled(): boolean {
    return process.env.ALERT_TELEGRAM_ENABLED === 'true';
  }

  async sendDiscordAlert(message: string): Promise<void> {
    if (!this.isDiscordEnabled()) {
      this.logger.log('[ALERT] Discord alert is disabled');
      return;
    }

    const webhookUrl = process.env.ALERT_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      this.logger.warn('[ALERT] Discord webhook URL is missing');
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          content: message,
        }),
      );

      this.logger.log('[ALERT] Discord alert sent successfully');
    } catch (error: any) {
      this.logger.error(
        `[ALERT] Failed to send Discord alert: ${error.message}`,
      );
    }
  }

  async sendTelegramAlert(message: string): Promise<void> {
    if (!this.isTelegramEnabled()) {
      this.logger.log('[ALERT] Telegram alert is disabled');
      return;
    }

    const botToken = process.env.ALERT_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ALERT_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      this.logger.warn('[ALERT] Telegram bot token or chat id is missing');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      await firstValueFrom(
        this.httpService.post(url, {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      );

      this.logger.log('[ALERT] Telegram alert sent successfully');
    } catch (error: any) {
      this.logger.error(
        `[ALERT] Failed to send Telegram alert: ${error.message}`,
      );
    }
  }

  async sendInvoiceAlert(message: string): Promise<void> {
    this.logger.warn(message);

    await Promise.all([
      this.sendDiscordAlert(message),
      this.sendTelegramAlert(message),
    ]);
  }

  async notifyStuckIssuingInvoices(params: {
    count: number;
    stuckMinutes: number;
    invoices: Array<{
      id: string;
      orderNumber?: string;
      buyerName?: string;
      updatedAt?: Date;
      invoiceStatus?: string;
    }>;
  }): Promise<void> {
    const lines = params.invoices
      .slice(0, 10)
      .map((invoice, index) => {
        return [
          `${index + 1}. Order: ${invoice.orderNumber ?? 'N/A'}`,
          `ID: ${invoice.id}`,
          `Buyer: ${invoice.buyerName ?? 'N/A'}`,
          `Status: ${invoice.invoiceStatus ?? 'N/A'}`,
          `UpdatedAt: ${invoice.updatedAt?.toISOString?.() ?? 'N/A'}`,
        ].join('\n');
      })
      .join('\n\n');

    const message = [
      '🚨 [INVOICE ALERT] Stuck ISSUING invoices',
      `Count: ${params.count}`,
      `Stuck longer than: ${params.stuckMinutes} minutes`,
      '',
      lines,
    ].join('\n');

    await this.sendInvoiceAlert(message);
  }

  async notifyTooManyFailedInvoices(params: {
    count: number;
    threshold: number;
    windowMinutes: number;
  }): Promise<void> {
    const message = [
      '🚨 [INVOICE ALERT] Too many FAILED invoices',
      `Failed count: ${params.count}`,
      `Threshold: ${params.threshold}`,
      `Window: ${params.windowMinutes} minutes`,
    ].join('\n');

    await this.sendInvoiceAlert(message);
  }

  async notifyInconsistentInvoices(params: {
    issuedWithoutCreatedIdCount: number;
    createdIdButNotIssuedCount: number;
  }): Promise<void> {
    const message = [
      '⚠️ [INVOICE ALERT] Inconsistent invoice status detected',
      `ISSUED but missing inv_invoiceCreatedId: ${params.issuedWithoutCreatedIdCount}`,
      `Has inv_invoiceCreatedId but status is not ISSUED: ${params.createdIdButNotIssuedCount}`,
    ].join('\n');

    await this.sendInvoiceAlert(message);
  }
}
