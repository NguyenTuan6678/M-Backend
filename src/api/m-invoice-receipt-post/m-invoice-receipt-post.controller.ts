import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CreateInvoiceFromTransactionDto } from './dto/send-receipt.req';
import { InvoiceIssueService } from '@utils/invoice-issue/invoice-issue.service';
import { SkipThrottle } from '@nestjs/throttler';
import { InvoiceQueueService } from '../queues/invoice-queue.service';

@ApiTags('M-Invoice Receipt Post')
@Controller('m-invoice-receipt-post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MInvoiceReceiptPostController {
  constructor(
    private readonly invoiceIssueService: InvoiceIssueService,
    private readonly invoiceQueueService: InvoiceQueueService,
  ) {}

  @Post()
  @SkipThrottle()
  @ApiOperation({ summary: 'Export M-Invoice' })
  @ApiQuery({
    name: 'tax_code',
    required: true,
    example: '0106026495-999',
    description: 'Tax code used to build M-Invoice API URL',
  })
  async createInvoiceWithRedis(
    @Query('tax_code') tax_code: string,
    @Body() body: CreateInvoiceFromTransactionDto,
    @Req() req: any,
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
      {
        actor: req.user,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
  }

  @Get('job-status')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get invoice issue job status by jobId',
    description:
      'Check BullMQ job state and SaleTransaction invoice status by jobId.',
  })
  async getInvoiceJobStatus(@Query('jobId') jobId: string) {
    return await this.invoiceQueueService.getInvoiceJobStatus(jobId);
  }
}
