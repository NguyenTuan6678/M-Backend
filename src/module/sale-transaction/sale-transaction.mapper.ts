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
  const invoiceItems: InvoiceItemDataDto[] = transaction.items.map(
    (item, index) => {
      const product = item.productId as any; // ✅ sau khi fix populate, đây là object đầy đủ
      return {
        tchat: 1,
        stt_rec0: index + 1,
        inv_itemCode: product.inv_itemCode,
        inv_itemName: product.inv_itemName,
        inv_unitCode: product.inv_unitCode,
        inv_discountPercentage: transaction.inv_discountPercentage,
        price: product.inv_unitPrice, // A
        inv_quantity: product.inv_quantity, // B — ✅ lấy từ product
        inv_discountAmount: product.inv_discountAmount, // C — ✅ lấy từ product
        ma_thue: parseFloat(product.ma_thue), // D
      };
    },
  );

  console.log('raw item[0]:', JSON.stringify(transaction.items?.[0], null, 2));

  const invoiceDetail: InvoiceDetailDto = { data: invoiceItems };

  const invoiceData: InvoiceDataDto = {
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
    key_api: transaction.key_api,
    cccdan: transaction.cccdan,
    so_hchieu: transaction.so_hchieu,
    mdvqhnsach_nmua: transaction.mdvqhnsach_nmua,
    ma_ch: transaction.ma_ch,
    ten_ch: transaction.ten_ch,
    details: [invoiceDetail],
  };

  return { data: [invoiceData] };
}
