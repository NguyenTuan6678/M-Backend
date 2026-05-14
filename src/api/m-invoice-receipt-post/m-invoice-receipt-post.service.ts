import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigType } from '@nestjs/config';
import { CreateInvoiceDto, InvoiceItemDataDto } from './dto/send-receipt.req';
import { mapTransactionToInvoice } from '@module/sale-transaction/sale-transaction.mapper';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';

@Injectable()
export class MInvoiceReceiptPostService {
  constructor(
    @Inject(configuration.KEY)
    private readonly config: ConfigType<typeof configuration>,
    private readonly httpService: HttpService,
    private readonly saleTransactionRepository: SaleTransactionRepository,
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

  private calculateItemFields(item: InvoiceItemDataDto) {
    const price = item.price;
    const quantity = item.inv_quantity;
    const discount = item.inv_discountAmount;
    const discountPercentage =
      item.inv_discountPercentage ||
      item.inv_discountAmount / (price * quantity);
    const tax = item.ma_thue / 100;

    const totalPrice = price * quantity - discount;
    const totalAmountWithVat = totalPrice / (1 + tax);
    const vatAmount = totalPrice - totalAmountWithVat;
    const totalBeforeDiscount = totalAmountWithVat / (1 - discountPercentage);
    const unitPrice = totalBeforeDiscount / quantity;

    return {
      ...item,
      inv_TotalAmountWithoutVat: totalAmountWithVat,
      inv_vatAmount: vatAmount,
      inv_TotalAmount: totalPrice,
      inv_unitPrice: unitPrice,
    };
  }

  private buildPayload(dto: CreateInvoiceDto): CreateInvoiceDto {
    return {
      ...dto,
      data: dto.data.map((invoiceData) => {
        const calculatedDetails = invoiceData.details.map((detail) => ({
          ...detail,
          data: detail.data.map((item) => this.calculateItemFields(item)),
        }));

        const allItems = calculatedDetails.flatMap((detail) => detail.data);

        const inv_discountAmount = allItems.reduce(
          (sum, item) => sum + (item.inv_discountAmount ?? 0),
          0,
        );
        const inv_TotalAmountWithoutVat = allItems.reduce(
          (sum, item) => sum + (item.inv_TotalAmountWithoutVat ?? 0),
          0,
        );
        const inv_vatAmount = allItems.reduce(
          (sum, item) => sum + (item.inv_vatAmount ?? 0),
          0,
        );
        const inv_TotalAmount = allItems.reduce(
          (sum, item) => sum + (item.inv_TotalAmount ?? 0),
          0,
        );

        return {
          ...invoiceData,
          inv_discountAmount,
          inv_TotalAmountWithoutVat,
          inv_vatAmount,
          inv_TotalAmount,
          details: calculatedDetails,
        };
      }),
    };
  }

  async createInvoice(
    tax_code: string,
    saleTransactionId: string,
    inv_invoiceSeries: string,
    inv_invoiceIssuedDate?: string,
    editmode?: number,
  ) {
    const defaultToken = this.config.mInvoiceToken.mToken;
    const baseUrl =
      tax_code === '0106026495-999' ? 'minvoice.site' : 'minvoice.app';
    const token =
      tax_code === '0106026495-999' ? defaultToken + tax_code : tax_code;

    const transaction =
      await this.saleTransactionRepository.findByIdWithPopulate(
        saleTransactionId,
      );

    if (!transaction) {
      throw new NotFoundException(
        `Sale transaction ${saleTransactionId} not found`,
      );
    }

    if ((transaction as any).inv_invoiceCreatedId) {
      return {
        ok: true,
        message: 'Invoice already created',
        data: {
          inv_invoiceCreatedId: (transaction as any).inv_invoiceCreatedId,
          inv_invoiceSeries: (transaction as any).inv_invoiceSeries,
          key_api: (transaction as any).key_api,
          inv_invoiceIssuedDate: (transaction as any).inv_invoiceIssuedDate,
        },
      };
    }

    const invoiceDto = mapTransactionToInvoice(transaction as any);

    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    invoiceDto.data = invoiceDto.data.map((d) => ({
      ...d,
      inv_invoiceSeries,
      inv_invoiceIssuedDate: inv_invoiceIssuedDate || today,
      key_api: saleTransactionId,
      so_benh_an: transaction.orderNumber,
    }));

    const builtPayload = this.buildPayload(invoiceDto);

    const payload = {
      editmode: editmode ?? 1,
      data: builtPayload.data,
    };

    // console.log('payload', JSON.stringify(payload, null, 2));

    const url = `https://${tax_code}.${baseUrl}/api/InvoiceApi78/Save`;

    const response = await this.callExternalApiWithRetry(() =>
      firstValueFrom(
        this.httpService.post(url, payload, {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    const responseData = response.data;

    // Lưu lại thông tin hoá đơn sau khi tạo thành công
    if (responseData?.ok && responseData?.data) {
      const {
        inv_invoiceSeries: resSeries,
        key_api: resKeyApi,
        id: resId,
        inv_invoiceIssuedDate: resIssuedDate,
      } = responseData.data;

      // Lấy orderNumber từ transaction đã fetch trước đó
      const orderNumber = (transaction as any).orderNumber;

      const activationDate = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });

      await this.saleTransactionRepository.update(saleTransactionId, {
        inv_invoiceSeries: resSeries,
        key_api: resKeyApi,
        inv_invoiceIssuedDate: resIssuedDate,
        inv_invoiceCreatedId: resId,
        so_benh_an: orderNumber, // ← tự cập nhật sau khi API thành công
        activationDate,
      });
    }

    return response.data;
  }
}
