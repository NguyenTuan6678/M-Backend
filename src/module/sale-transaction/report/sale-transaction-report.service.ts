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
      { header: 'TỔNG TIỀN SAU THUẾ', key: 'inv_TotalAmount', width: 22 },
      { header: 'GIÁ ĐỐI SOÁT', key: 'invReconciliation', width: 18 },
      { header: 'DOANH THU VIẾT CHÊNH', key: 'diffRevenue', width: 24 },
      { header: 'PHÍ VIẾT CHÊNH', key: 'diffFee', width: 18 },
      { header: 'DOANH THU CHÊNH LỆCH', key: 'diffNetRevenue', width: 24 },
      { header: 'SỐ TIỀN CHIẾT KHẤU', key: 'inv_discountAmount', width: 22 },
      { header: 'THU TIỀN', key: 'amountCollected', width: 18 },
      { header: 'CÒN LẠI', key: 'remainingAmount', width: 18 },
    ];

    let rowIndex = 2;
    transactions.forEach((transaction, index) => {
      const commissionPercent = transaction.agencyId?.commissionPercent ?? 50;
      const getRealQuantity = (item: any) => {
        const price = Number(item.price ?? item.productId?.inv_unitPrice ?? 0);
        const revenue = Number(item.revenue ?? 0);
        if (price > 0 && commissionPercent > 0 && revenue > 0) {
          const calculated = Math.round(
            revenue / (price * (commissionPercent / 100)),
          );
          if (calculated > 0) {
            return calculated;
          }
        }
        return item.quantity ?? 1;
      };

      const inv_TotalAmount = Number(transaction.inv_TotalAmount || 0);
      const inv_discountAmount = Number(transaction.inv_discountAmount || 0);
      const amountCollected = Number(transaction.amountCollected || 0);
      const reportDate = this.formatDateOnly(
        transaction.inv_invoiceIssuedDate || transaction.activationDate,
      );

      const items = transaction.items || [];
      if (items.length === 0) {
        sheet.addRow({
          stt: index + 1,
          reportDate,
          inv_buyerLegalName: transaction.inv_buyerLegalName || '',
          inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
          agencyName: transaction.agencyId?.agencyName || '',
          employeeName: transaction.employeeId?.employeeName || '',
          productCodes: '',
          quantities: '',
          inv_TotalAmount,
          invReconciliation: transaction.invReconciliation ?? 0,
          diffRevenue: { formula: `=I${rowIndex}-J${rowIndex}` },
          diffFee: { formula: `=K${rowIndex}*15%` },
          diffNetRevenue: { formula: `=K${rowIndex}-L${rowIndex}` },
          inv_discountAmount,
          amountCollected,
          remainingAmount: { formula: `=I${rowIndex}-N${rowIndex}` },
        });
        rowIndex++;
      } else if (items.length === 1) {
        const item = items[0];
        const productCode = item.productId?.inv_itemProduct || '';
        const quantity = getRealQuantity(item);
        sheet.addRow({
          stt: index + 1,
          reportDate,
          inv_buyerLegalName: transaction.inv_buyerLegalName || '',
          inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
          agencyName: transaction.agencyId?.agencyName || '',
          employeeName: transaction.employeeId?.employeeName || '',
          productCodes: productCode,
          quantities: quantity,
          inv_TotalAmount,
          invReconciliation: transaction.invReconciliation ?? 0,
          diffRevenue: { formula: `=I${rowIndex}-J${rowIndex}` },
          diffFee: { formula: `=K${rowIndex}*15%` },
          diffNetRevenue: { formula: `=K${rowIndex}-L${rowIndex}` },
          inv_discountAmount,
          amountCollected,
          remainingAmount: { formula: `=I${rowIndex}-N${rowIndex}` },
        });
        rowIndex++;
      } else {
        // Dòng tổng hợp đầu tiên cho hóa đơn nhiều sản phẩm
        sheet.addRow({
          stt: index + 1,
          reportDate,
          inv_buyerLegalName: transaction.inv_buyerLegalName || '',
          inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
          agencyName: transaction.agencyId?.agencyName || '',
          employeeName: transaction.employeeId?.employeeName || '',
          productCodes: '', // Ẩn mã sản phẩm ở dòng tổng
          quantities: '', // Ẩn số lượng ở dòng tổng
          inv_TotalAmount,
          invReconciliation: transaction.invReconciliation ?? 0,
          diffRevenue: { formula: `=I${rowIndex}-J${rowIndex}` },
          diffFee: { formula: `=K${rowIndex}*15%` },
          diffNetRevenue: { formula: `=K${rowIndex}-L${rowIndex}` },
          inv_discountAmount,
          amountCollected,
          remainingAmount: { formula: `=I${rowIndex}-N${rowIndex}` },
        });
        rowIndex++;

        // Các dòng chi tiết sản phẩm tách dòng bên dưới (hiển thị lại thông tin metadata chung)
        items.forEach((item: any) => {
          const productCode = item.productId?.inv_itemProduct || '';
          const quantity = getRealQuantity(item);

          sheet.addRow({
            stt: '',
            reportDate,
            inv_buyerLegalName: transaction.inv_buyerLegalName || '',
            inv_buyerTaxCode: transaction.inv_buyerTaxCode || '',
            agencyName: transaction.agencyId?.agencyName || '',
            employeeName: transaction.employeeId?.employeeName || '',
            productCodes: productCode,
            quantities: quantity,
            inv_TotalAmount: '',
            invReconciliation: '',
            diffRevenue: '',
            diffFee: '',
            diffNetRevenue: '',
            inv_discountAmount: '',
            amountCollected: '',
            remainingAmount: '',
          });
          rowIndex++;
        });
      }
    });

    this.styleHeader(sheet);

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: 'A1',
      to: 'P1',
    };

    sheet.getColumn('inv_TotalAmount').numFmt = '#,##0';
    sheet.getColumn('invReconciliation').numFmt = '#,##0';
    sheet.getColumn('diffRevenue').numFmt = '#,##0';
    sheet.getColumn('diffFee').numFmt = '#,##0';
    sheet.getColumn('diffNetRevenue').numFmt = '#,##0';
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
          productCode: product?.inv_itemProduct || '',
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
