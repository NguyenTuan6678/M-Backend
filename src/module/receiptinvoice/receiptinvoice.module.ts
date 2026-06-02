import { MongooseModule } from '@nestjs/mongoose';
import {
  ReceiptInvoice,
  ReceiptInvoiceSchema,
} from '@schemas/receiptinvoice.schema';
import { ReceiptInvoiceController } from './receiptinvoice.controller';
import { ReceiptInvoiceService } from './receiptinvoice.service';
import { ReceiptInvoiceRepository } from '@repositories/receiptinvoice.repository';
import { LoggerService } from '@common/loggers/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReceiptInvoice.name, schema: ReceiptInvoiceSchema },
    ]),
  ],
  controllers: [ReceiptInvoiceController],
  providers: [
    ReceiptInvoiceService,
    ReceiptInvoiceRepository,
    LoggerService,
    JwtAuthGuard,
  ],
  exports: [ReceiptInvoiceService, ReceiptInvoiceRepository, MongooseModule],
})
export class ReceiptInvoiceModule {}
