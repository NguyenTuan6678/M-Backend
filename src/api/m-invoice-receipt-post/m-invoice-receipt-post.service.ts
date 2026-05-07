import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class MInvoiceReceiptPostService {
  constructor(
    @Inject(configuration.KEY)
    private readonly config: ConfigType<typeof configuration>,
    private readonly httpService: HttpService,
  ) {}

  async createInvoice(tax_code: string, payload: any) {
    const defaultToken = this.config.mInvoiceToken.mToken;
    const baseIUrl =
      tax_code === '0106026495-999' ? 'minvoice.site' : 'minvoice.app';
    const token =
      tax_code === '0106026495-999' ? defaultToken + tax_code : tax_code;
    const response = await firstValueFrom(
      this.httpService.post(
        `https://${tax_code}.${baseIUrl}/api/InvoiceApi78/Save`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }
}
