import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
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

  async getTransactions(tax_code: string) {
    const defaultToken = this.config.mInvoiceToken.mToken;
    const baseIUrl =
      tax_code === '0106026495-999' ? 'minvoice.site' : 'minvoice.app';
    const token =
      tax_code === '0106026495-999' ? defaultToken + tax_code : tax_code;
    const response = await firstValueFrom(
      this.httpService.get(
        `https://${tax_code}.${baseIUrl}/api/Invoice68/GetTypeInvoiceSeries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );
    return response.data;
  }
}
