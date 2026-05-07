import {
  SalesTransaction,
  TransactionItem,
} from '@schemas/sale-transaction.schema';
import { Product } from '@schemas/product.schema';
import {
  CreateInvoiceDto,
  InvoiceDataDto,
  InvoiceDetailDto,
  InvoiceItemDataDto,
} from '../../api/m-invoice-receipt-post/dto/send-receipt.req';

type PopulatedTransactionItem = Omit<TransactionItem, 'productId'> & {
  productId: Product;
};

type PopulatedSalesTransaction = Omit<SalesTransaction, 'items'> & {
  items: PopulatedTransactionItem[];
};

export function mapTransactionToInvoice(
  transaction: PopulatedSalesTransaction,
): CreateInvoiceDto {
  // Map mỗi item trong transaction sang InvoiceItemDataDto
  // capitalPrice, totalSalary, accountingAccountCode chỉ lưu nội bộ — không đưa vào invoice
  const invoiceItems: InvoiceItemDataDto[] = transaction.items.map((item) => {
    const product = item.productId;
    const vatAmount = item.revenue * (product.taxRate / 100);

    return {
      inv_itemCode: product.accountCode,
      inv_itemName: product.name,
      inv_unitPrice: product.price,
      inv_quantity: transaction.inv_quantity,
      inv_discountPercentage: transaction.inv_discountPercentage,
      inv_discountAmount: transaction.inv_discountAmount,
      inv_TotalAmountWithoutVat: item.revenue,
      inv_vatAmount: vatAmount,
      inv_TotalAmount: item.revenue + vatAmount,
    };
  });

  const invoiceDetail: InvoiceDetailDto = {
    data: invoiceItems,
  };

  const invoiceData: InvoiceDataDto = {
    inv_invoiceSeries: transaction.inv_invoiceSeries,
    inv_invoiceIssuedDate: transaction.inv_invoiceIssuedDate,
    inv_currencyCode: transaction.inv_currencyCode,
    inv_exchangeRate: transaction.inv_exchangeRate,
    so_benh_an: transaction.so_benh_an,
    inv_buyerDisplayName: transaction.inv_buyerDisplayName,
    inv_buyerLegalName: transaction.inv_buyerLegalName,
    inv_buyerTaxCode: transaction.inv_buyerTaxCode,
    inv_buyerAddressLine: transaction.inv_buyerAddressLine,
    inv_buyerEmail: transaction.inv_buyerEmail,
    inv_buyerBankAccount: transaction.inv_buyerBankAccount,
    inv_buyerBankName: transaction.inv_buyerBankName,
    inv_paymentMethodName: transaction.inv_paymentMethodName,
    inv_discountAmount: transaction.inv_discountAmount,
    inv_TotalAmountWithoutVat: transaction.inv_TotalAmountWithoutVAT,
    inv_vatAmount: transaction.inv_vatAmount,
    inv_TotalAmount: transaction.inv_TotalAmount,
    key_api: transaction.key_api,
    cccdan: transaction.cccdan,
    so_hchieu: transaction.so_hchieu,
    mdvqhnsach_nmua: transaction.mdvqhnsach_nmua,
    ma_ch: transaction.ma_ch,
    ten_ch: transaction.ten_ch,
    details: [invoiceDetail],
  };

  return {
    data: [invoiceData],
  };
}
