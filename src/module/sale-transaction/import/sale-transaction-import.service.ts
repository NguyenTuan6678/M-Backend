import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { SaleTransactionService } from '../sale-transaction.service';
import { AgencyRepository } from '@repositories/agency.repository';
import { ProductRepository } from '@repositories/product.repository';
import { CreateSalesTransactionDto } from '../dto/create-sale-transaction.req';
import {
  ImportError,
  ImportPreviewResult,
  ImportResult,
  ResolvedImportItem,
  ResolvedImportTransaction,
  SaleTransactionExcelRow,
  SaleTransactionItemExcelRow,
} from './sale-transaction-import.type';

@Injectable()
export class SaleTransactionImportService {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
    private readonly agencyRepository: AgencyRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  private getCellStringByIndex(row: any, index: number): string {
    const value = row.getCell(index).value;

    if (value === null || value === undefined) return '';

    if (typeof value === 'object' && 'text' in value) {
      return String((value as any).text).trim();
    }

    if (typeof value === 'object' && 'result' in value) {
      return String((value as any).result ?? '').trim();
    }

    if (typeof value === 'object' && 'hyperlink' in value) {
      return String((value as any).text ?? '').trim();
    }

    return String(value).trim();
  }

  private getCellNumberByIndex(
    row: any,
    index: number,
    defaultValue: any = 0,
  ): any {
    const raw = this.getCellStringByIndex(row, index);

    if (raw === '') return defaultValue;

    const normalized = raw.replace(/,/g, '');
    const number = Number(normalized);

    return Number.isNaN(number) ? defaultValue : number;
  }

  async preview(fileBuffer: Buffer): Promise<ImportPreviewResult> {
    const workbook = await this.loadWorkbook(fileBuffer);

    const transactions = this.parseSaleTransactionSheet(workbook);
    const items = this.parseSaleTransactionItemsSheet(workbook);

    const errors: ImportError[] = [];

    this.validateParsedRows(transactions, items, errors);

    if (errors.length > 0) {
      return {
        totalTransactions: transactions.length,
        totalItems: items.length,
        valid: false,
        errors,
        preview: [],
      };
    }

    const resolved = await this.resolveRows(transactions, items, errors);

    return {
      totalTransactions: transactions.length,
      totalItems: items.length,
      valid: errors.length === 0,
      errors,
      preview: errors.length === 0 ? resolved : [],
    };
  }

  async import(fileBuffer: Buffer): Promise<ImportResult> {
    const preview = await this.preview(fileBuffer);

    if (!preview.valid) {
      return {
        totalTransactions: preview.totalTransactions,
        imported: 0,
        errors: preview.errors,
        results: [],
      };
    }

    const results: any[] = [];

    for (const row of preview.preview) {
      const dto = this.mapToCreateSaleTransactionDto(row);

      const result =
        await this.saleTransactionService.createSaleTransaction(dto);

      results.push({
        rowKey: row.rowKey,
        result,
      });
    }

    return {
      totalTransactions: preview.totalTransactions,
      imported: results.length,
      errors: [],
      results,
    };
  }

  private async loadWorkbook(fileBuffer: Buffer): Promise<Workbook> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('Excel file buffer is empty');
    }

    const firstBytes = fileBuffer.subarray(0, 4).toString('hex');

    if (!firstBytes.startsWith('504b')) {
      throw new BadRequestException(
        'Invalid Excel file. Please upload a real .xlsx file.',
      );
    }

    const workbook = new Workbook();

    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch (error: any) {
      throw new BadRequestException(
        `Cannot read Excel file. Please upload a valid .xlsx file. Detail: ${error.message}`,
      );
    }

    return workbook;
  }

  private parseSaleTransactionSheet(
    workbook: Workbook,
  ): SaleTransactionExcelRow[] {
    const sheet = workbook.getWorksheet('SaleTransaction');

    if (!sheet) {
      throw new BadRequestException('Sheet SaleTransaction not found');
    }

    const rows: SaleTransactionExcelRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || this.isEmptyRow(row)) return;

      const rowKey = this.getCellStringByIndex(row, 2);

      if (!rowKey) return;

      rows.push({
        excelRowNumber: rowNumber,

        // B
        rowKey,

        // C
        agencyNumber: this.getCellStringByIndex(row, 3),

        // D - G
        inv_currencyCode: this.getCellStringByIndex(row, 4),
        inv_exchangeRate: this.getCellNumberByIndex(row, 5, 1),
        inv_invoiceSeries: this.getCellStringByIndex(row, 6),
        inv_invoiceIssuedDate: this.getCellStringByIndex(row, 7),

        // H - O
        inv_buyerDisplayName: this.getCellStringByIndex(row, 8),
        inv_buyerLegalName: this.getCellStringByIndex(row, 9),
        inv_buyerTaxCode: this.getCellStringByIndex(row, 10),
        inv_buyerAddressLine: this.getCellStringByIndex(row, 11),
        inv_buyerEmail: this.getCellStringByIndex(row, 12),
        inv_buyerBankAccount: this.getCellStringByIndex(row, 13),
        inv_buyerBankName: this.getCellStringByIndex(row, 14),
        inv_paymentMethodName: this.getCellStringByIndex(row, 15),

        // P - S
        inv_discountAmount: this.getCellNumberByIndex(row, 16, 0),
        inv_TotalAmountWithoutVAT: this.getCellNumberByIndex(row, 17, 0),
        inv_vatAmount: this.getCellNumberByIndex(row, 18, 0),
        inv_TotalAmount: this.getCellNumberByIndex(row, 19, 0),
        invReconciliation: this.getCellNumberByIndex(row, 20, 0),

        // T - X
        cccdan: this.getCellStringByIndex(row, 21),
        so_hchieu: this.getCellStringByIndex(row, 22),
        mdvqhnsach_nmua: this.getCellStringByIndex(row, 23),
        ma_ch: this.getCellStringByIndex(row, 24),
        ten_ch: this.getCellStringByIndex(row, 25),

        // Y - Z
        inv_quantity: this.getCellNumberByIndex(row, 26, 1),
        inv_discountPercentage: this.getCellNumberByIndex(row, 27, 0),
      });
    });

    return rows;
  }

  private parseSaleTransactionItemsSheet(
    workbook: Workbook,
  ): SaleTransactionItemExcelRow[] {
    const sheet = workbook.getWorksheet('SaleTransaction_Items');

    if (!sheet) {
      throw new BadRequestException('Sheet SaleTransaction_Items not found');
    }

    const rows: SaleTransactionItemExcelRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || this.isEmptyRow(row)) return;

      const rowKey = this.getCellStringByIndex(row, 2);

      if (!rowKey) return;

      rows.push({
        excelRowNumber: rowNumber,

        // B
        rowKey,

        // C
        productCode: this.getCellStringByIndex(row, 3),

        // D - G
        revenue: this.getCellNumberByIndex(row, 4, 0),
        capitalPrice: this.getCellNumberByIndex(row, 5, 0),
        totalSalary: this.getCellNumberByIndex(row, 6, 0),
        accountingAccountCode: this.getCellNumberByIndex(row, 7, 0),

        // H - I
        quantity: this.getCellNumberByIndex(row, 8, 1),
        price: this.getCellNumberByIndex(row, 9, null),
      });
    });

    return rows;
  }
  private validateParsedRows(
    transactions: SaleTransactionExcelRow[],
    items: SaleTransactionItemExcelRow[],
    errors: ImportError[],
  ) {
    const rowKeySet = new Set<string>();

    for (const row of transactions) {
      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'rowKey',
        row.rowKey,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_currencyCode',
        row.inv_currencyCode,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_buyerDisplayName',
        row.inv_buyerDisplayName,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_buyerLegalName',
        row.inv_buyerLegalName,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_buyerTaxCode',
        row.inv_buyerTaxCode,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_buyerAddressLine',
        row.inv_buyerAddressLine,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'inv_paymentMethodName',
        row.inv_paymentMethodName,
      );

      this.required(
        errors,
        'SaleTransaction',
        row.excelRowNumber,
        'agencyNumber',
        row.agencyNumber,
      );

      if (row.rowKey) {
        if (rowKeySet.has(row.rowKey)) {
          errors.push({
            sheet: 'SaleTransaction',
            row: row.excelRowNumber,
            field: 'rowKey',
            message: `Duplicate rowKey: ${row.rowKey}`,
          });
        }

        rowKeySet.add(row.rowKey);
      }
    }

    for (const item of items) {
      this.required(
        errors,
        'SaleTransaction_Items',
        item.excelRowNumber,
        'rowKey',
        item.rowKey,
      );

      this.required(
        errors,
        'SaleTransaction_Items',
        item.excelRowNumber,
        'productCode',
        item.productCode,
      );

      if (!rowKeySet.has(item.rowKey)) {
        errors.push({
          sheet: 'SaleTransaction_Items',
          row: item.excelRowNumber,
          field: 'rowKey',
          message: `rowKey ${item.rowKey} does not exist in SaleTransaction sheet`,
        });
      }

      if (item.revenue < 0) {
        errors.push({
          sheet: 'SaleTransaction_Items',
          row: item.excelRowNumber,
          field: 'revenue',
          message: 'revenue must be greater than or equal to 0',
        });
      }

      if (item.capitalPrice < 0) {
        errors.push({
          sheet: 'SaleTransaction_Items',
          row: item.excelRowNumber,
          field: 'capitalPrice',
          message: 'capitalPrice must be greater than or equal to 0',
        });
      }

      if (item.totalSalary < 0) {
        errors.push({
          sheet: 'SaleTransaction_Items',
          row: item.excelRowNumber,
          field: 'totalSalary',
          message: 'totalSalary must be greater than or equal to 0',
        });
      }
    }

    for (const transaction of transactions) {
      const hasItem = items.some((item) => item.rowKey === transaction.rowKey);

      if (!hasItem) {
        errors.push({
          sheet: 'SaleTransaction',
          row: transaction.excelRowNumber,
          field: 'items',
          message: `Transaction ${transaction.rowKey} must have at least one item`,
        });
      }
    }
  }

  private async resolveRows(
    transactions: SaleTransactionExcelRow[],
    items: SaleTransactionItemExcelRow[],
    errors: ImportError[],
  ): Promise<ResolvedImportTransaction[]> {
    const result: ResolvedImportTransaction[] = [];

    for (const transaction of transactions) {
      const agency = await this.agencyRepository.findActiveByAgencyNumber(
        transaction.agencyNumber,
      );

      if (!agency) {
        errors.push({
          sheet: 'SaleTransaction',
          row: transaction.excelRowNumber,
          field: 'agencyNumber',
          message: `Agency not found: ${transaction.agencyNumber}`,
        });

        continue;
      }

      const transactionItems = items.filter(
        (item) => item.rowKey === transaction.rowKey,
      );

      const resolvedItems: ResolvedImportItem[] = [];

      for (const item of transactionItems) {
        const product = await this.productRepository.findByItemCode(
          item.productCode,
        );

        if (!product) {
          errors.push({
            sheet: 'SaleTransaction_Items',
            row: item.excelRowNumber,
            field: 'productCode',
            message: `Product not found: ${item.productCode}`,
          });

          continue;
        }

        resolvedItems.push({
          ...item,
          productId: String((product as any)._id),
        });
      }

      if (resolvedItems.length > 0) {
        result.push({
          ...transaction,
          agencyId: String((agency as any)._id),
          items: resolvedItems,
        });
      }
    }

    return result;
  }

  private mapToCreateSaleTransactionDto(
    row: ResolvedImportTransaction,
  ): CreateSalesTransactionDto {
    return {
      inv_invoiceSeries: row.inv_invoiceSeries || '',
      activationDate: row.inv_invoiceIssuedDate || '',

      inv_currencyCode: row.inv_currencyCode,
      inv_exchangeRate: row.inv_exchangeRate,

      so_benh_an: '',
      inv_buyerDisplayName: row.inv_buyerDisplayName,
      inv_buyerLegalName: row.inv_buyerLegalName,
      inv_buyerTaxCode: row.inv_buyerTaxCode,
      inv_buyerAddressLine: row.inv_buyerAddressLine,
      inv_buyerEmail: row.inv_buyerEmail || '',
      inv_buyerBankAccount: row.inv_buyerBankAccount || '',
      inv_buyerBankName: row.inv_buyerBankName || '',
      inv_paymentMethodName: row.inv_paymentMethodName,

      inv_discountAmount: row.inv_discountAmount,
      inv_TotalAmountWithoutVAT: row.inv_TotalAmountWithoutVAT,
      inv_vatAmount: row.inv_vatAmount,
      inv_TotalAmount: row.inv_TotalAmount,
      invReconciliation: row.invReconciliation || 0,

      key_api: '',
      cccdan: row.cccdan || '',
      so_hchieu: row.so_hchieu || '',
      mdvqhnsach_nmua: row.mdvqhnsach_nmua || '',
      ma_ch: row.ma_ch || '',
      ten_ch: row.ten_ch || '',

      inv_quantity: row.inv_quantity ?? 1,
      inv_discountPercentage: row.inv_discountPercentage,

      agencyId: row.agencyId,

      items: row.items.map((item) => ({
        productId: item.productId,
        revenue: item.revenue,
        capitalPrice: item.capitalPrice,
        totalSalary: item.totalSalary,
        accountingAccountCode: item.accountingAccountCode,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }

  private isEmptyRow(row: any): boolean {
    let hasValue = false;

    row.eachCell((cell: any) => {
      if (
        cell.value !== null &&
        cell.value !== undefined &&
        String(cell.value).trim() !== ''
      ) {
        hasValue = true;
      }
    });

    return !hasValue;
  }

  private required(
    errors: ImportError[],
    sheet: string,
    row: number,
    field: string,
    value: any,
  ) {
    if (value === null || value === undefined || String(value).trim() === '') {
      errors.push({
        sheet,
        row,
        field,
        message: `${field} is required`,
      });
    }
  }
}
