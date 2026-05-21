import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { MInvoiceReceiptPostService } from './m-invoice-receipt-post.service';
import { CreateInvoiceFromTransactionDto } from './dto/send-receipt.req';
import { InvoiceIssueService } from '@utils/invoice-issue/invoice-issue.service';

@ApiTags('M-Invoice Receipt Post')
@Controller('m-invoice-receipt-post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MInvoiceReceiptPostController {
  constructor(private invoiceIssueService: InvoiceIssueService) {}

  @Post()
  async createInvoice(
    @Query('tax_code') tax_code: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: CreateInvoiceFromTransactionDto,
  ) {
    return this.invoiceIssueService.enqueueIssueInvoice(
      body.saleTransactionId,
      {
        tax_code,
        inv_invoiceSeries: body.inv_invoiceSeries,
        inv_invoiceIssuedDate: body.inv_invoiceIssuedDate,
        editmode: body.editmode,
      },
    );
  }
}
