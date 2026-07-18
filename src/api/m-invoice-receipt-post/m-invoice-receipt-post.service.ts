import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
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
import { InvoiceStatus } from '@utils/transaction-status';
import { ERROR_RES } from '@common/constants/error.const';

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
    const price = Number(item.price || 0);
    const quantity = Number(item.inv_quantity ?? 1);
    const discount = 0;
    const discountPercentage = 0;

    const { invoiceTaxCode, taxRate } = this.resolveTaxCodeAndRate(
      item.ma_thue,
    );

    const totalPrice = price * quantity - discount;

    const totalAmountWithoutVat = totalPrice / (1 + taxRate);
    const vatAmount = totalPrice - totalAmountWithoutVat;

    const totalBeforeDiscount =
      discountPercentage >= 1
        ? totalAmountWithoutVat
        : totalAmountWithoutVat / (1 - discountPercentage);

    const unitPrice = quantity > 0 ? totalBeforeDiscount / quantity : 0;

    return {
      ...item,
      ma_thue: invoiceTaxCode, // giá trị dùng để xuất hóa đơn
      inv_quantity: quantity,
      inv_discountAmount: discount,
      inv_discountPercentage: discountPercentage,
      inv_TotalAmountWithoutVat: totalAmountWithoutVat,
      inv_vatAmount: vatAmount,
      inv_TotalAmount: totalPrice,
      inv_unitPrice: unitPrice,
    };
  }

  private resolveTaxCodeAndRate(maThue: string | number): {
    invoiceTaxCode: number;
    taxRate: number;
  } {
    const taxCode = String(maThue).trim().toUpperCase();

    if (taxCode === 'KCT' || taxCode === '-1') {
      return { invoiceTaxCode: -1, taxRate: 0 };
    }

    if (taxCode === 'KKKNT' || taxCode === '-2') {
      return { invoiceTaxCode: -2, taxRate: 0 };
    }

    const taxPercent = Number(maThue);

    if (Number.isNaN(taxPercent)) {
      throw new BadRequestException(
        `Invalid ma_thue: ${maThue}. Accepted values: KCT, KKKNT, or number.`,
      );
    }

    return {
      invoiceTaxCode: taxPercent,
      taxRate: taxPercent / 100,
    };
  }

  private buildPayload(dto: CreateInvoiceDto): CreateInvoiceDto {
    return {
      ...dto,
      data: dto.data.map((invoiceData) => {
        const calculatedDetails = invoiceData.details.map((detail) => {
          const calculatedItems = detail.data.map((item) =>
            this.calculateItemFields(item),
          );

          return {
            ...detail,
            data: calculatedItems,
          };
        });

        const allItems = calculatedDetails.flatMap((detail) => detail.data);

        const inv_quantity = allItems.reduce(
          (sum, item) => sum + Number(item.inv_quantity || 0),
          0,
        );

        const inv_discountAmount = allItems.reduce(
          (sum, item) => sum + Number(item.inv_discountAmount || 0),
          0,
        );

        const inv_TotalAmountWithoutVat = allItems.reduce(
          (sum, item) => sum + Number(item.inv_TotalAmountWithoutVat || 0),
          0,
        );

        const inv_vatAmount = allItems.reduce(
          (sum, item) => sum + Number(item.inv_vatAmount || 0),
          0,
        );

        const inv_TotalAmount = allItems.reduce(
          (sum, item) => sum + Number(item.inv_TotalAmount || 0),
          0,
        );

        return {
          ...invoiceData,
          inv_quantity,
          inv_discountAmount,
          inv_TotalAmountWithoutVat,
          inv_vatAmount,
          inv_TotalAmount,
          details: calculatedDetails,
        };
      }),
    };
  }

  async processCreateInvoice(
    tax_code: string,
    saleTransactionId: string,
    inv_invoiceSeries: string,
    inv_invoiceIssuedDate?: string,
    editmode?: number,
    inv_invoiceNumber?: number,
    inv_invoiceAuth_id?: string,
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

    if (editmode !== 2 && (transaction as any).inv_invoiceCreatedId) {
      return {
        ok: true,
        message: 'Invoice already created',
        data: {
          inv_invoiceCreatedId: (transaction as any).inv_invoiceCreatedId,
          inv_invoiceSeries: (transaction as any).inv_invoiceSeries,
          key_api: (transaction as any).key_api,
          inv_invoiceIssuedDate: (transaction as any).inv_invoiceIssuedDate,
          invoiceStatus: (transaction as any).invoiceStatus,
        },
      };
    }

    if (editmode === 2 && !(transaction as any).inv_invoiceCreatedId) {
      throw new BadRequestException(
        'Cannot update invoice: Invoice has not been issued yet',
      );
    }

    await this.saleTransactionRepository.update(saleTransactionId, {
      invoiceStatus: InvoiceStatus.ISSUING,
      isActive: true,
    });

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
      inv_invoiceAuth_id: inv_invoiceAuth_id || d.inv_invoiceAuth_id,
      inv_invoiceNumber:
        inv_invoiceNumber !== undefined
          ? inv_invoiceNumber
          : d.inv_invoiceNumber,
    }));

    const builtPayload = this.buildPayload(invoiceDto);

    const payload = {
      editmode: editmode ?? 1,
      data: builtPayload.data,
    };

    const url = `https://${tax_code}.${baseUrl}/api/InvoiceApi78/Save`;

    let response: any;

    try {
      response = await this.callExternalApiWithRetry(() =>
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
    } catch (error) {
      try {
        await this.saleTransactionRepository.update(saleTransactionId, {
          invoiceStatus: InvoiceStatus.FAILED,
        });
      } catch (updateError) {
        console.error('[UPDATE TRANSACTION FAILED STATUS ERROR]', updateError);
      }

      throw error;
    }

    const responseData = response.data;

    if (responseData?.ok && responseData?.data) {
      const {
        inv_invoiceSeries: resSeries,
        id: resId,
        inv_invoiceIssuedDate: resIssuedDate,
        inv_invoiceNumber,
      } = responseData.data;

      const orderNumber = (transaction as any).orderNumber;

      await this.saleTransactionRepository.update(saleTransactionId, {
        inv_invoiceSeries: resSeries,
        key_api: saleTransactionId,
        inv_invoiceIssuedDate: resIssuedDate,
        inv_invoiceCreatedId: resId,
        invoiceNumber: inv_invoiceNumber || undefined,
        so_benh_an: orderNumber,
        invoiceStatus: InvoiceStatus.ISSUED,
        isActive: true,
        invoiceFilePath: '',
      });
    } else {
      await this.saleTransactionRepository.update(saleTransactionId, {
        invoiceStatus: InvoiceStatus.FAILED,
        isActive: true,
      });
    }

    console.log('[M-INVOICE API RESPONSE]', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  }

  async getCompanyInfo(taxCode: string) {
    let response: any = null;
    try {
      if (!taxCode) {
        response = {
          data: ERROR_RES.BAD_REQUEST_ERROR,
        };
        return response;
      }

      const url =
        taxCode.length === 12
          ? `https://mst.minvoice.com.vn/api/System/SearchCMND?cid=${taxCode}`
          : `https://mst.minvoice.com.vn/api/System/SearchTaxCodeV2?tax=${taxCode}`;
      const res = await firstValueFrom(this.httpService.get(url));
      response = {
        data: res.data,
      };
    } catch (error) {
      response = {
        data: error,
      };
    }
    return response;
  }
}
