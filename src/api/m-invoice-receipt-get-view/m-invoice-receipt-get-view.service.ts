import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { UploadInvoiceService } from '@utils/upload-invoice.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ViewMInvoiceReceiptService {
  constructor(
    @Inject(configuration.KEY)
    private readonly config: ConfigType<typeof configuration>,
    private readonly httpService: HttpService,
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly uploadInvoiceService: UploadInvoiceService,
  ) {}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async callExternalApiWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const start = Date.now();

      try {
        const result = await fn();

        console.log('[M-Invoice API SUCCESS]', {
          attempt,
          durationMs: Date.now() - start,
        });

        return result;
      } catch (error) {
        lastError = error;

        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const code = axiosError.code;

        console.error('[M-Invoice API FAILED]', {
          attempt,
          durationMs: Date.now() - start,
          status,
          code,
          message: axiosError.message,
        });

        const shouldRetry =
          code === 'ECONNABORTED' ||
          code === 'ECONNRESET' ||
          status === 408 ||
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!shouldRetry || attempt === retries) {
          break;
        }

        await this.sleep(delayMs * attempt);
      }
    }

    const axiosError = lastError as AxiosError;

    if (axiosError.code === 'ECONNABORTED') {
      throw new GatewayTimeoutException('M-Invoice API timeout');
    }

    throw new BadGatewayException({
      message: 'M-Invoice API is temporarily unavailable',
      status: axiosError.response?.status,
      error: axiosError.response?.data ?? axiosError.message,
    });
  }

  async viewInvoice(tax_code: string, inv_invoiceCreatedId: string) {
    const defaultToken = this.config.mInvoiceToken.mToken;
    const baseUrl =
      tax_code === '0106026495-999' ? 'minvoice.site' : 'minvoice.app';
    const token =
      tax_code === '0106026495-999' ? defaultToken + tax_code : tax_code;

    const transaction =
      await this.saleTransactionRepository.findByInvoiceCreatedId(
        inv_invoiceCreatedId,
      );

    if (!transaction) {
      throw new NotFoundException(
        `Không tìm thấy hoá đơn đã xuất với ID: ${inv_invoiceCreatedId}`,
      );
    }

    const url = `https://${tax_code}.${baseUrl}/api/InvoiceApi78/PrintInvoice?id=${
      inv_invoiceCreatedId
    }`;

    const response = await this.callExternalApiWithRetry(() =>
      firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }),
      ),
    );

    const filePath = await this.uploadInvoiceService.saveInvoice(response.data);

    return { filePath };
  }
}
