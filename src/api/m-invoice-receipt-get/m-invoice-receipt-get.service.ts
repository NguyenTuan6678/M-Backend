import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import configuration from '@config/configuration';

@Injectable()
export class MInvoiceReceiptGetService {
  constructor(
    @Inject(configuration.KEY)
    private readonly config: ConfigType<typeof configuration>,
    private readonly httpService: HttpService,
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

  async getTransactions(tax_code: string) {
    const defaultToken = this.config.mInvoiceToken.mToken;
    const baseIUrl =
      tax_code === '0106026495-999' ? 'minvoice.site' : 'minvoice.app';
    const token =
      tax_code === '0106026495-999' ? defaultToken + tax_code : tax_code;

    const url = `https://${tax_code}.${baseIUrl}/api/Invoice68/GetTypeInvoiceSeries`;

    const response = await this.callExternalApiWithRetry(() =>
      firstValueFrom(
        this.httpService.get(url, {
          timeout: 1500,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    return response.data;
  }
}
