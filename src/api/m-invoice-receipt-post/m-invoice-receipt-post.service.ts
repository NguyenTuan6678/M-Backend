import configuration from '@config/configuration';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
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

  private calculateItemFields(item: InvoiceItemDataDto) {
    const A = item.price;
    const B = item.inv_quantity;
    const C = item.inv_discountAmount;
    const D = item.ma_thue / 100;

    const G = A * B - C; // inv_TotalAmountWithoutVat
    const F = G * D; // inv_vatAmount
    const E = G + F; // inv_TotalAmount
    const I = G / B; // inv_unitPrice

    return {
      ...item,
      inv_TotalAmountWithoutVat: G,
      inv_vatAmount: F,
      inv_TotalAmount: E,
      inv_unitPrice: I,
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

    const invoiceDto = mapTransactionToInvoice(transaction as any);

    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    invoiceDto.data = invoiceDto.data.map((d) => ({
      ...d,
      inv_invoiceSeries,
      inv_invoiceIssuedDate: inv_invoiceIssuedDate || today,
      key_api: saleTransactionId,
    }));

    const builtPayload = this.buildPayload(invoiceDto);

    const payload = {
      editmode: editmode ?? 1,
      data: builtPayload.data,
    };

    // console.log('payload', JSON.stringify(payload, null, 2));

    const response = await firstValueFrom(
      this.httpService.post(
        `https://${tax_code}.${baseUrl}/api/InvoiceApi78/Save`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
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

      // Lấy saleTransactionNumber từ transaction đã fetch trước đó
      const saleTransactionNumber = (transaction as any).saleTransactionNumber;

      await this.saleTransactionRepository.update(saleTransactionId, {
        inv_invoiceSeries: resSeries,
        key_api: resKeyApi,
        inv_invoiceIssuedDate: resIssuedDate,
        inv_invoiceCreatedId: resId,
        so_benh_an: saleTransactionNumber, // ← tự cập nhật sau khi API thành công
      });
    }

    return response.data;
  }
}
