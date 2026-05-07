import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { MInvoiceReceiptPostService } from './m-invoice-receipt-post.service';
import { CreateInvoiceDto } from './dto/send-receipt.req';

@ApiTags('M-Invoice Receipt Post')
@Controller('m-invoice-receipt-post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MInvoiceReceiptPostController {
  constructor(private receiptPostService: MInvoiceReceiptPostService) {}

  @Post()
  async createInvoice(
    @Query('tax_code') tax_code: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.receiptPostService.createInvoice(tax_code, dto);
  }
}
