import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MInvoiceReceiptGetService } from './m-invoice-receipt-get.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('M-Invoice Receipt')
@Controller('m-invoice-receipt')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MInvoiceReceiptGetController {
  constructor(private receiptService: MInvoiceReceiptGetService) {}

  @Get()
  async getData(@Query('tax_code') tax_code: string) {
    return await this.receiptService.getTransactions(tax_code);
  }
}
