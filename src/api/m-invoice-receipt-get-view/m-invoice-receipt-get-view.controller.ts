import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ViewMInvoiceReceiptService } from './m-invoice-receipt-get-view.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@ApiTags('M-Invoice Receipt View')
@Controller('m-invoice-receipt-get-view')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ViewMInvoiceReceiptController {
  constructor(private mInvoiceService: ViewMInvoiceReceiptService) {}

  @Get()
  @ApiOperation({ summary: 'Print invoice by sale transaction ID' })
  async printInvoice(
    @Query('tax_code') tax_code: string,
    @Query('inv_invoiceCreatedId') inv_invoiceCreatedId: string,
  ) {
    return await this.mInvoiceService.viewInvoice(
      tax_code,
      inv_invoiceCreatedId,
    );
  }
}
