import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadInvoiceService {
  private readonly rootPath = process.cwd();

  async saveInvoice(dataInvoice: string | ArrayBuffer): Promise<string> {
    const pdfBuffer =
      typeof dataInvoice === 'string'
        ? Buffer.from(dataInvoice, 'binary')
        : Buffer.from(dataInvoice);

    const pdfFileName = `invoice_${Date.now()}.pdf`;

    const filePath = path.join(this.rootPath, 'files', pdfFileName);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    await fs.promises.writeFile(filePath, pdfBuffer);

    return `/files/${pdfFileName}`;
  }

  async saveXMLZipInvoice(dataInvoice: string | ArrayBuffer): Promise<string> {
    const xmlZipBuffer =
      typeof dataInvoice === 'string'
        ? Buffer.from(dataInvoice, 'binary')
        : Buffer.from(dataInvoice);

    const xmlZipFileName = `invoice_${Date.now()}.zip`;

    const filePath = path.join(this.rootPath, 'invoice', xmlZipFileName);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    await fs.promises.writeFile(filePath, xmlZipBuffer);

    return `/invoice/${xmlZipFileName}`;
  }

  async deleteInvoice(invoiceUrl: string): Promise<void> {
    if (!invoiceUrl) {
      return;
    }

    const invoicePath = path.join(this.rootPath, invoiceUrl);

    if (!fs.existsSync(invoicePath)) {
      return;
    }

    await fs.promises.unlink(invoicePath);
  }

  async deleteInvoiceFileUpload(fileName: string): Promise<void> {
    if (!fileName) {
      return;
    }

    const invoiceFile = path.join(this.rootPath, 'uploads', fileName);

    if (!fs.existsSync(invoiceFile)) {
      return;
    }

    await fs.promises.unlink(invoiceFile);
  }
}
