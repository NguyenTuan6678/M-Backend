import * as fs from 'fs';
import { join } from 'path';
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

  private buildFileUrl(filePath: string, customBaseUrl?: string): string {
    const baseUrl =
      customBaseUrl ||
      process.env.API_BASE_URL ||
      `http://localhost:${process.env.PORT || 4000}`;

    return `${baseUrl}${filePath}`;
  }

  private getAbsoluteFilePath(filePath: string): string {
    const normalizedPath = filePath.startsWith('/')
      ? filePath.slice(1)
      : filePath;

    return join(process.cwd(), normalizedPath);
  }

  private fileExists(filePath: string): boolean {
    try {
      const absolutePath = this.getAbsoluteFilePath(filePath);
      return fs.existsSync(absolutePath);
    } catch {
      return false;
    }
  }

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

  async viewInvoice(
    tax_code: string,
    inv_invoiceCreatedId: string,
    customBaseUrl?: string,
  ) {
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

    const cachedFilePath = (transaction as any).invoiceFilePath;

    if (cachedFilePath && this.fileExists(cachedFilePath)) {
      return {
        filePath: cachedFilePath,
        fileUrl: this.buildFileUrl(cachedFilePath, customBaseUrl),
        cached: true,
      };
    }

    if (cachedFilePath && !this.fileExists(cachedFilePath)) {
      await this.saleTransactionRepository.update((transaction as any)._id, {
        invoiceFilePath: '',
      } as any);
    }

    const url = `https://${tax_code}.${baseUrl}/api/InvoiceApi78/PrintInvoice`;

    const response = await this.callExternalApiWithRetry(
      () =>
        firstValueFrom(
          this.httpService.get(url, {
            timeout: 30000,
            responseType: 'arraybuffer',
            params: {
              id: inv_invoiceCreatedId,
            },
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf,application/octet-stream,*/*',
            },
          }),
        ),
      1,
      1000,
    );

    console.log('[VIEW INVOICE RESPONSE]', {
      status: response.status,
      contentType: response.headers?.['content-type'],
      size: response.data?.byteLength || response.data?.length,
    });

    const filePath = await this.uploadInvoiceService.saveInvoice(response.data);

    await this.saleTransactionRepository.update((transaction as any)._id, {
      invoiceFilePath: filePath,
    } as any);

    return {
      filePath,
      fileUrl: this.buildFileUrl(filePath, customBaseUrl),
      cached: false,
    };
  }
}
