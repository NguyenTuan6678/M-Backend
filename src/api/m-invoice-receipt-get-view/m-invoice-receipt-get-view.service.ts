import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

    const response = await firstValueFrom(
      this.httpService.get(
        `https://${tax_code}.${baseUrl}/api/InvoiceApi78/PrintInvoice?id=${inv_invoiceCreatedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer', // ← nhận về dạng binary
        },
      ),
    );

    // Lưu PDF và trả về đường dẫn
    const filePath = await this.uploadInvoiceService.saveInvoice(response.data);

    return { filePath };
  }
}
