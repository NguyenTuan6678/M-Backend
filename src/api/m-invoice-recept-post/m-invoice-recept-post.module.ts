import { Module } from '@nestjs/common';
import { MInvoiceReceptPostService } from './m-invoice-recept-post.service';
import { MInvoiceReceptPostController } from './m-invoice-recept-post.controller';

@Module({
  providers: [MInvoiceReceptPostService],
  controllers: [MInvoiceReceptPostController]
})
export class MInvoiceReceptPostModule {}
