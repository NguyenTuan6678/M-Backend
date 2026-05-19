import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/configuration';
import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';
import { ViewMInvoiceReceiptController } from './m-invoice-receipt-get-view.controller';
import { ViewMInvoiceReceiptService } from './m-invoice-receipt-get-view.service';
import { UploadInvoiceService } from '@utils/upload-invoice.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule.forFeature(configuration),
    SaleTransactionModule,
  ],
  controllers: [ViewMInvoiceReceiptController],
  providers: [ViewMInvoiceReceiptService, UploadInvoiceService],
})
export class ViewMInvoiceReceiptModule {}
