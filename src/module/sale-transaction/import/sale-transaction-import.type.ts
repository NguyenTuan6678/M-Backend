export type ImportError = {
  sheet: string;
  row: number;
  field: string;
  message: string;
};

export type SaleTransactionExcelRow = {
  excelRowNumber: number;
  rowKey: string;

  inv_currencyCode: string;
  inv_exchangeRate: number;
  inv_invoiceSeries?: string;
  inv_invoiceIssuedDate?: string;

  inv_buyerDisplayName: string;
  inv_buyerLegalName: string;
  inv_buyerTaxCode: string;
  inv_buyerAddressLine: string;
  inv_buyerEmail?: string;
  inv_buyerBankAccount?: string;
  inv_buyerBankName?: string;
  inv_paymentMethodName: string;

  inv_discountAmount: number;
  inv_TotalAmountWithoutVAT: number;
  inv_vatAmount: number;
  inv_TotalAmount: number;
  invReconciliation: number;

  cccdan?: string;
  so_hchieu?: string;
  mdvqhnsach_nmua?: string;
  ma_ch?: string;
  ten_ch?: string;

  inv_quantity?: number;
  inv_discountPercentage: number;

  agencyNumber: string;
};

export type SaleTransactionItemExcelRow = {
  excelRowNumber: number;
  rowKey: string;

  productCode: string;

  revenue: number;
  capitalPrice: number;
  totalSalary: number;
  accountingAccountCode: number;
  quantity?: number;
  price?: number;
};

export type ResolvedImportItem = SaleTransactionItemExcelRow & {
  productId: string;
};

export type ResolvedImportTransaction = SaleTransactionExcelRow & {
  agencyId: string;
  items: ResolvedImportItem[];
};

export type ImportPreviewResult = {
  totalTransactions: number;
  totalItems: number;
  valid: boolean;
  errors: ImportError[];
  preview: ResolvedImportTransaction[];
};

export type ImportResult = {
  totalTransactions: number;
  imported: number;
  errors: ImportError[];
  results: any[];
};
