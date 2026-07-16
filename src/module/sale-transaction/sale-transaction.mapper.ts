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

function mapTaxCode(maThue: string | number | undefined | null): number {
  const taxCode = String(maThue ?? '')
    .trim()
    .toUpperCase();

  if (taxCode === 'KCT' || taxCode === '-1') {
    return -1;
  }

  if (taxCode === 'KKKNT' || taxCode === '-2') {
    return -2;
  }

  const taxPercent = Number(taxCode);

  if (Number.isNaN(taxPercent)) {
    return 0;
  }

  return taxPercent;
}

export function mapTransactionToInvoice(
  transaction: PopulatedSalesTransaction,
): CreateInvoiceDto {
  const invoiceItems: InvoiceItemDataDto[] = transaction.items.map(
    (item, index) => {
      const product = item.productId as any;
      return {
        tchat: 1,
        stt_rec0: index + 1,
        inv_itemCode: product.inv_itemCode,
        inv_itemName: product.inv_itemName,
        inv_unitCode: product.inv_unitCode,
        inv_discountPercentage: transaction.inv_discountPercentage,
        price: item.price ?? product.inv_unitPrice,
        inv_quantity: transaction.inv_quantity ?? 1,
        inv_discountAmount: product.inv_discountAmount,
        ma_thue: mapTaxCode(product.ma_thue),
      };
    },
  );

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
