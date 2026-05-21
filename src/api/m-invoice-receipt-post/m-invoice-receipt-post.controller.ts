import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CreateInvoiceFromTransactionDto } from './dto/send-receipt.req';
import { InvoiceIssueService } from '@utils/invoice-issue/invoice-issue.service';

@ApiTags('M-Invoice Receipt Post')
@Controller('m-invoice-receipt-post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MInvoiceReceiptPostController {
  constructor(private readonly invoiceIssueService: InvoiceIssueService) {}

  @Post()
  @ApiQuery({
    name: 'tax_code',
    required: true,
    example: '0106026495-999',
    description: 'Tax code used to build M-Invoice API URL',
  })
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
    if (!tax_code) {
      throw new BadRequestException('tax_code is required');
    }

    console.log('[CREATE INVOICE CONTROLLER]', {
      tax_code,
      body,
    });

    return await this.invoiceIssueService.enqueueIssueInvoice(
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
