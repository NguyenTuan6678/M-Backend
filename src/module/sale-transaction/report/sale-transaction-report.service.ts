import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { QuerySaleTransactionReportDto } from '../dto/query-transaction-report.req';

@Injectable()
export class SaleTransactionReportService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
  ) {}

  async exportSaleTransactionReport(
    query: QuerySaleTransactionReportDto,
  ): Promise<Buffer> {
    const transactions =
      await this.saleTransactionRepository.findForReport(query);

    const workbook = new Workbook();

    workbook.creator = 'M-Invoice Backend';
    workbook.created = new Date();

    this.createSummarySheet(workbook, transactions, query);
    this.createTransactionSheet(workbook, transactions);
    this.createItemSheet(workbook, transactions);

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer as ArrayBuffer);
  }

  private createSummarySheet(
    workbook: Workbook,
    transactions: any[],
    query: QuerySaleTransactionReportDto,
  ) {
    const sheet = workbook.addWorksheet('Summary');

    const totalTransactions = transactions.length;

    const totalPaid = transactions.filter((t) => t.isPaid === true).length;
    const totalUnpaid = transactions.filter((t) => t.isPaid !== true).length;

    const totalWithoutVat = transactions.reduce(
      (sum, t) => sum + Number(t.inv_TotalAmountWithoutVAT || 0),
      0,
    );

    const totalVat = transactions.reduce(
      (sum, t) => sum + Number(t.inv_vatAmount || 0),
      0,
    );

    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.inv_TotalAmount || 0),
      0,
    );

    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value', key: 'value', width: 30 },
    ];

    sheet.addRows([
      {
        metric: 'Report name',
        value: 'Sale Transaction Report',
      },
      {
        metric: 'Start date',
        value: query.startDate || 'All',
      },
      {
        metric: 'End date',
        value: query.endDate || 'All',
      },
      {
        metric: 'Invoice status',
        value: query.invoiceStatus || 'ISSUED',
      },
      {
        metric: 'Payment status',
        value:
          query.isPaid === undefined ? 'All' : query.isPaid ? 'Paid' : 'Unpaid',
      },
      {
        metric: 'Total transactions',
        value: totalTransactions,
      },
      {
        metric: 'Total paid',
        value: totalPaid,
      },
      {
        metric: 'Total unpaid',
        value: totalUnpaid,
      },
      {
        metric: 'Total amount without VAT',
        value: totalWithoutVat,
      },
      {
        metric: 'Total VAT amount',
        value: totalVat,
      },
      {
        metric: 'Total amount',
        value: totalAmount,
      },
      {
        metric: 'Exported at',
        value: this.formatDateTime(new Date()),
      },
    ]);

    this.styleHeader(sheet);

    sheet.getColumn('value').numFmt = '#,##0';
  }

  private createTransactionSheet(workbook: Workbook, transactions: any[]) {
    const sheet = workbook.addWorksheet('SaleTransactions');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Order Number', key: 'orderNumber', width: 18 },
      //   { header: 'Invoice Created ID', key: 'inv_invoiceCreatedId', width: 42 },
      //   { header: 'Invoice Series', key: 'inv_invoiceSeries', width: 18 },
      //   {
      //     header: 'Invoice Issued Date',
      //     key: 'inv_invoiceIssuedDate',
      //     width: 24,
      //   },
      { header: 'Trạng thái', key: 'invoiceStatus', width: 18 },
      { header: 'Thanh toán', key: 'isPaid', width: 12 },
      { header: 'Tên người mua', key: 'inv_buyerDisplayName', width: 28 },
      { header: 'Tên công ty', key: 'inv_buyerLegalName', width: 32 },
      { header: 'Mã số thuế', key: 'inv_buyerTaxCode', width: 22 },
      { header: 'Địa chỉ', key: 'inv_buyerAddressLine', width: 36 },
      { header: 'Email người mua', key: 'inv_buyerEmail', width: 28 },
      {
        header: 'Phương thức thanh toán',
        key: 'inv_paymentMethodName',
        width: 18,
      },
      { header: 'Tên ngân hàng', key: 'bankName', width: 26 },
      { header: 'Mã đại lý', key: 'agencyNumber', width: 18 },
      { header: 'Tên đại lý', key: 'agencyName', width: 26 },
      { header: 'Nhân viên', key: 'employeeName', width: 26 },
      { header: 'Phòng ban', key: 'departmentName', width: 26 },
      {
        header: 'Tiền trước thuế',
        key: 'inv_TotalAmountWithoutVAT',
        width: 22,
      },
      { header: 'Tiền sau thuế', key: 'inv_vatAmount', width: 18 },
      { header: 'Tổng tiển', key: 'inv_TotalAmount', width: 18 },
      { header: 'Được tạo vào ngày', key: 'createdAt', width: 24 },
      { header: 'Được cập nhật vào lúc', key: 'updatedAt', width: 24 },
    ];

    transactions.forEach((transaction, index) => {
      sheet.addRow({
        stt: index + 1,
        orderNumber: transaction.orderNumber || '',
        // inv_invoiceCreatedId: transaction.inv_invoiceCreatedId || '',
        // inv_invoiceSeries: transaction.inv_invoiceSeries || '',
        // inv_invoiceIssuedDate: this.formatDateTime(
        //   transaction.inv_invoiceIssuedDate,
        // ),
        invoiceStatus: transaction.invoiceStatus || '',
        isPaid: transaction.isPaid ? 'TRUE' : 'FALSE',
        inv_buyerDisplayName: transaction.inv_buyerDisplayName || '',
        inv_buyerLegalName: transaction.inv_buyerLegalName || '',
        inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
        inv_buyerAddressLine: transaction.inv_buyerAddressLine || '',
        inv_buyerEmail: transaction.inv_buyerEmail || '',
        inv_paymentMethodName: transaction.inv_paymentMethodName || '',
        bankName: transaction.bankId?.inv_buyerBankName || '',
        agencyNumber: transaction.agencyId?.agencyNumber || '',
        agencyName: transaction.agencyId?.agencyName || '',
        employeeName: transaction.employeeId?.employeeName || '',
        departmentName:
          transaction.departmentId?.departmentName ||
          transaction.employeeId?.departmentId?.departmentName ||
          '',
        inv_TotalAmountWithoutVAT: Number(
          transaction.inv_TotalAmountWithoutVAT || 0,
        ),
        inv_vatAmount: Number(transaction.inv_vatAmount || 0),
        inv_TotalAmount: Number(transaction.inv_TotalAmount || 0),
        createdAt: this.formatDateTime(transaction.createdAt),
        updatedAt: this.formatDateTime(transaction.updatedAt),
      });
    });

    this.styleHeader(sheet);

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: 'A1',
      to: 'W1',
    };

    sheet.getColumn('inv_TotalAmountWithoutVAT').numFmt = '#,##0';
    sheet.getColumn('inv_vatAmount').numFmt = '#,##0';
    sheet.getColumn('inv_TotalAmount').numFmt = '#,##0';
  }

  private createItemSheet(workbook: Workbook, transactions: any[]) {
    const sheet = workbook.addWorksheet('Items');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã hoá đơn', key: 'orderNumber', width: 18 },
      { header: 'Trạng thái', key: 'invoiceStatus', width: 18 },
      { header: 'Thanh toán', key: 'isPaid', width: 12 },
      { header: 'Mã sản phẩm', key: 'productCode', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 32 },
      { header: 'Đơn vị', key: 'unitCode', width: 14 },
      { header: 'Đơn giá', key: 'unitPrice', width: 18 },
      { header: 'Tỉ giá thuế', key: 'taxRate', width: 12 },
      { header: 'Doanh thu', key: 'revenue', width: 18 },
      { header: 'Giá vốn', key: 'capitalPrice', width: 18 },
      { header: 'Tổng lương', key: 'totalSalary', width: 18 },
      {
        header: 'Mã tài khoản kế toán',
        key: 'accountingAccountCode',
        width: 26,
      },
    ];

    let index = 1;

    transactions.forEach((transaction) => {
      const items = transaction.items || [];

      items.forEach((item: any) => {
        const product = item.productId;

        sheet.addRow({
          stt: index++,
          orderNumber: transaction.orderNumber || '',
          invoiceStatus: transaction.invoiceStatus || '',
          isPaid: transaction.isPaid ? 'TRUE' : 'FALSE',
          productCode: product?.inv_itemCode || '',
          productName: product?.inv_itemName || '',
          unitCode: product?.inv_unitCode || '',
          unitPrice: Number(product?.inv_unitPrice || 0),
          taxRate: product?.ma_thue || '',
          revenue: Number(item.revenue || 0),
          capitalPrice: Number(item.capitalPrice || 0),
          totalSalary: Number(item.totalSalary || 0),
          accountingAccountCode: item.accountingAccountCode || '',
        });
      });
    });

    this.styleHeader(sheet);

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: 'A1',
      to: 'M1',
    };

    sheet.getColumn('unitPrice').numFmt = '#,##0';
    sheet.getColumn('revenue').numFmt = '#,##0';
    sheet.getColumn('capitalPrice').numFmt = '#,##0';
    sheet.getColumn('totalSalary').numFmt = '#,##0';
  }

  private styleHeader(sheet: any) {
    const headerRow = sheet.getRow(1);

    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF305496' },
    };

    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    headerRow.height = 22;
  }

  private formatDateTime(value: any): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  }
}
