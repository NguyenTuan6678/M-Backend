import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { AgencyRepository } from '@repositories/agency.repository';
import { QuerySaleTransactionReportDto } from '../dto/query-transaction-report.req';

@Injectable()
export class SaleTransactionReportService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly agencyRepository: AgencyRepository,
  ) {}

  private formatInvoiceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'CHƯA XUẤT',
      ISSUING: 'ĐANG XUẤT',
      ISSUED: 'ĐÃ XUẤT',
      FAILED: 'LỖI',
      CANCELLED: 'HUỶ',
    };

    return statusMap[status] || status || '';
  }

  async exportSaleTransactionReport(
    query: QuerySaleTransactionReportDto,
  ): Promise<{ buffer: Buffer; agencyName?: string }> {
    const transactions =
      await this.saleTransactionRepository.findForReport(query);

    const workbook = new Workbook();

    workbook.creator = 'M-Invoice Backend';
    workbook.created = new Date();

    // this.createSummarySheet(workbook, transactions, query);
    this.createTransactionSheet(workbook, transactions);
    this.createItemSheet(workbook, transactions);

    // Hide summary and item sheets
    // const summarySheet = workbook.getWorksheet('Tổng hợp');
    // if (summarySheet) {
    //   summarySheet.state = 'hidden';
    // }
    const itemSheet = workbook.getWorksheet('Sản phẩm');
    if (itemSheet) {
      itemSheet.state = 'hidden';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    let agencyName: string | undefined;
    if (query.agencyId) {
      const agency = await this.agencyRepository.findById(query.agencyId);
      if (agency) {
        agencyName = agency.agencyName;
      }
    }

    return {
      buffer: Buffer.from(buffer as ArrayBuffer),
      agencyName,
    };
  }

  private createSummarySheet(
    workbook: Workbook,
    transactions: any[],
    query: QuerySaleTransactionReportDto,
  ) {
    const sheet = workbook.addWorksheet('Tổng hợp');

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
      { header: 'Số liệu', key: 'metric', width: 35 },
      { header: 'Giá trị', key: 'value', width: 30 },
    ];

    sheet.addRows([
      {
        metric: 'Tên báo cáo',
        value: 'Transaction Report',
      },
      {
        metric: 'Ngày bắt đầu',
        value: query.startDate || 'All',
      },
      {
        metric: 'Ngày kết thúc',
        value: query.endDate || 'All',
      },
      {
        metric: 'Trạng thái hoá đơn',
        value: query.invoiceStatus || '',
      },
      {
        metric: 'Trạng thái thanh toán',
        value:
          query.isPaid === undefined
            ? 'TẤT CẢ'
            : query.isPaid
              ? 'ĐÃ THANH TOÁN'
              : 'CHƯA THANH TOÁN',
      },
      {
        metric: 'Tổng giao dịch',
        value: totalTransactions,
      },
      {
        metric: 'Tổng giao dịch thanh toán',
        value: totalPaid,
      },
      {
        metric: 'Tổng giao dịch chưa thanh toán',
        value: totalUnpaid,
      },
      {
        metric: 'Tổng tiền trước thuế',
        value: totalWithoutVat,
      },
      {
        metric: 'Tổng tiền thuế',
        value: totalVat,
      },
      {
        metric: 'Tổng tiền',
        value: totalAmount,
      },
      {
        metric: 'Xuất báo cáo vào lúc',
        value: this.formatDateTime(new Date()),
      },
    ]);

    this.styleHeader(sheet);

    sheet.getColumn('value').numFmt = '#,##0';
  }

  private createTransactionSheet(workbook: Workbook, transactions: any[]) {
    const sheet = workbook.addWorksheet('Hoá đơn');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      // { header: 'SỐ ĐƠN HÀNG', key: 'orderNumber', width: 18 },
      //   { header: 'Invoice Created ID', key: 'inv_invoiceCreatedId', width: 42 },
      //   { header: 'Invoice Series', key: 'inv_invoiceSeries', width: 18 },
      //   {
      //     header: 'Invoice Issued Date',
      //     key: 'inv_invoiceIssuedDate',
      //     width: 24,
      //   },
      // { header: 'TRẠNG THÁI', key: 'invoiceStatus', width: 18 },
      // { header: 'THANH TOÁN', key: 'isPaid', width: 12 },
      // { header: 'TÊN NGƯỜI MUA', key: 'inv_buyerDisplayName', width: 28 },
      { header: 'NGÀY KÍCH HOẠT', key: 'reportDate', width: 16 },
      { header: 'TÊN CÔNG TY', key: 'inv_buyerLegalName', width: 32 },
      { header: 'MÃ SỐ THUẾ', key: 'inv_buyerTaxCode', width: 22 },
      // { header: 'Địa chỉ', key: 'inv_buyerAddressLine', width: 36 },
      // { header: 'Email người mua', key: 'inv_buyerEmail', width: 28 },
      // {
      //   header: 'Phương thức thanh toán',
      //   key: 'inv_paymentMethodName',
      //   width: 18,
      // },
      // { header: 'Tên ngân hàng', key: 'bankName', width: 26 },
      // { header: 'Mã đại lý', key: 'agencyNumber', width: 18 },
      { header: 'TÊN ĐẠI LÝ', key: 'agencyName', width: 26 },
      { header: 'NHÂN VIÊN', key: 'employeeName', width: 26 },
      { header: 'MÃ SẢN PHẨM', key: 'productCodes', width: 20 },
      { header: 'SỐ LƯỢNG', key: 'quantities', width: 12 },
      // { header: 'PHÒNG BAN', key: 'departmentName', width: 26 },
      // {
      //   header: 'TIỀN TRƯỚC THUẾ',
      //   key: 'inv_TotalAmountWithoutVAT',
      //   width: 22,
      // },
      // { header: 'TIỀN THUẾ', key: 'inv_vatAmount', width: 18 },
      // { header: 'TỔNG TIỀN', key: 'inv_TotalAmount', width: 18 },
      //   { header: 'Được tạo vào ngày', key: 'createdAt', width: 24 },
      //   { header: 'Được cập nhật vào lúc', key: 'updatedAt', width: 24 },
      { header: 'TỔNG TIỀN SAU THUẾ', key: 'inv_TotalAmount', width: 22 },
      { header: 'GIÁ SẢN PHẨM', key: 'totalProductPrice', width: 20 },
      { header: 'PHÍ VIẾT CHÊNH', key: 'priceDifference', width: 18 },
      { header: 'SỐ TIỀN CHIẾT KHẤU', key: 'inv_discountAmount', width: 22 },
      { header: 'THU TIỀN', key: 'amountCollected', width: 18 },
      { header: 'CÒN LẠI', key: 'remainingAmount', width: 18 },
    ];

    transactions.forEach((transaction, index) => {
      const totalProductPrice = (transaction.items || []).reduce(
        (sum: number, item: any) =>
          sum +
          Number(item.price ?? item.productId?.inv_unitPrice ?? 0) *
            Number(item.quantity ?? 1),
        0,
      );
      const inv_TotalAmount = Number(transaction.inv_TotalAmount || 0);
      const inv_discountAmount = Number(transaction.inv_discountAmount || 0);
      const amountCollected = Number(transaction.amountCollected || 0);
      const reportDate = this.formatDateOnly(
        transaction.inv_invoiceIssuedDate || transaction.activationDate,
      );
      const rowNum = index + 2;

      const productCodes = (transaction.items || [])
        .map((item: any) => item.productId?.inv_itemCode)
        .filter(Boolean)
        .join(', ');
      const quantities = (transaction.items || [])
        .map((item: any) => item.quantity ?? 1)
        .join(', ');

      sheet.addRow({
        stt: index + 1,
        // orderNumber: transaction.orderNumber || '',
        // inv_invoiceCreatedId: transaction.inv_invoiceCreatedId || '',
        // inv_invoiceSeries: transaction.inv_invoiceSeries || '',
        // inv_invoiceIssuedDate: this.formatDateTime(
        //   transaction.inv_invoiceIssuedDate,
        // ),
        // invoiceStatus: this.formatInvoiceStatus(transaction.invoiceStatus),
        // isPaid: transaction.isPaid ? 'ĐÃ THU' : 'CHƯA THU',
        // inv_buyerDisplayName: transaction.inv_buyerDisplayName || '',
        reportDate,
        inv_buyerLegalName: transaction.inv_buyerLegalName || '',
        inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
        // inv_buyerAddressLine: transaction.inv_buyerAddressLine || '',
        // inv_buyerEmail: transaction.inv_buyerEmail || '',
        // inv_paymentMethodName: transaction.inv_paymentMethodName || '',
        // bankName: transaction.bankId?.inv_buyerBankName || '',
        // agencyNumber: transaction.agencyId?.agencyNumber || '',
        agencyName: transaction.agencyId?.agencyName || '',
        employeeName: transaction.employeeId?.employeeName || '',
        productCodes,
        quantities,
        // departmentName:
        //   transaction.departmentId?.departmentName ||
        //   transaction.employeeId?.departmentId?.departmentName ||
        //   '',
        // inv_TotalAmountWithoutVAT: Number(
        //   transaction.inv_TotalAmountWithoutVAT || 0,
        // ),
        // inv_vatAmount: Number(transaction.inv_vatAmount || 0),
        // inv_TotalAmount: Number(transaction.inv_TotalAmount || 0),
        // createdAt: this.formatDateTime(transaction.createdAt),
        // updatedAt: this.formatDateTime(transaction.updatedAt),
        inv_TotalAmount,
        totalProductPrice,
        priceDifference: { formula: `=I${rowNum}-J${rowNum}` },
        inv_discountAmount,
        amountCollected,
        remainingAmount: { formula: `=I${rowNum}-L${rowNum}` },
      });
    });

    this.styleHeader(sheet);

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: 'A1',
      to: 'N1',
    };

    sheet.getColumn('inv_TotalAmount').numFmt = '#,##0';
    sheet.getColumn('totalProductPrice').numFmt = '#,##0';
    sheet.getColumn('priceDifference').numFmt = '#,##0';
    sheet.getColumn('inv_discountAmount').numFmt = '#,##0';
    sheet.getColumn('amountCollected').numFmt = '#,##0';
    sheet.getColumn('remainingAmount').numFmt = '#,##0';
  }

  private createItemSheet(workbook: Workbook, transactions: any[]) {
    const sheet = workbook.addWorksheet('Sản phẩm');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'MÃ HOÁ ĐƠN', key: 'orderNumber', width: 18 },
      { header: 'TRẠNG THÁI', key: 'invoiceStatus', width: 18 },
      { header: 'THANH TOÁN', key: 'isPaid', width: 12 },
      { header: 'MÃ SẢN PHẨM', key: 'productCode', width: 18 },
      { header: 'TÊN SẢN PHẨM', key: 'productName', width: 32 },
      { header: 'ĐƠN VỊ', key: 'unitCode', width: 14 },
      { header: 'Đơn giá', key: 'unitPrice', width: 18 },
      { header: 'TỈ GIÁ THUẾ', key: 'taxRate', width: 12 },
      { header: 'DOANH THU', key: 'revenue', width: 18 },
      { header: 'GIÁ VỐN', key: 'capitalPrice', width: 18 },
      { header: 'TỔNG LƯƠNG', key: 'totalSalary', width: 18 },
      {
        header: 'MÃ TÀI KHOẢN KẾ TOÁN',
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
          invoiceStatus: this.formatInvoiceStatus(transaction.invoiceStatus),
          isPaid: transaction.isPaid ? 'ĐÃ THU' : 'CHƯA THU',
          productCode: product?.inv_itemCode || '',
          productName: product?.inv_itemName || '',
          unitCode: product?.inv_unitCode || '',
          unitPrice: Number(item.price ?? product?.inv_unitPrice ?? 0),
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

  private formatDateOnly(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const matchYYYYMMDD = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (matchYYYYMMDD) {
        return `${matchYYYYMMDD[3]}/${matchYYYYMMDD[2]}/${matchYYYYMMDD[1]}`;
      }
      const matchDDMMYYYY = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (matchDDMMYYYY) {
        const d = matchDDMMYYYY[1].padStart(2, '0');
        const m = matchDDMMYYYY[2].padStart(2, '0');
        const y = matchDDMMYYYY[3];
        return `${d}/${m}/${y}`;
      }
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}
