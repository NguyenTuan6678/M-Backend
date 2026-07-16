export type IssueInvoiceJob = {
  saleTransactionId: string;
  tax_code: string;
  inv_invoiceSeries: string;
  inv_invoiceIssuedDate?: string;
  editmode?: number;
  inv_invoiceNumber?: number;
  inv_invoiceAuth_id?: string;
};
