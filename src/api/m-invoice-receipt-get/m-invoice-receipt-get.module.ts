import { Module } from '@nestjs/common';
import { MInvoiceReceiptGetService } from './m-invoice-receipt-get.service';
import { MInvoiceReceiptGetController } from './m-invoice-receipt-get.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule.register({ timeout: 5000, maxRedirects: 5 })],
  providers: [MInvoiceReceiptGetService],
  controllers: [MInvoiceReceiptGetController],
})
export class MInvoiceReceiptGetModule {}
