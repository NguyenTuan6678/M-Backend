import { Module } from '@nestjs/common';
import { MInvoiceReceiptPostService } from './m-invoice-receipt-post.service';
import { MInvoiceReceiptPostController } from './m-invoice-receipt-post.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [MInvoiceReceiptPostService],
  controllers: [MInvoiceReceiptPostController],
})
export class MInvoiceReceiptPostModule {}
