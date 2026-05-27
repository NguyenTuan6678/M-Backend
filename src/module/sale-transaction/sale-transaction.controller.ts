import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SaleTransactionService } from '@module/sale-transaction/sale-transaction.service';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { SaleTransactionResponseDTO } from '@module/sale-transaction/dto/sale-transaction.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { MessageResponse } from '@app-types/message.res';
import { QuerySaleTransactionDto } from './dto/query-transaction.req';
import { UpdateSaleTransactionBankDto } from './dto/update-transaction-bank.req';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SaleTransactionReportService } from './report/sale-transaction-report.service';
import { QuerySaleTransactionReportDto } from './dto/query-transaction-report.req';

@ApiTags('Sale Transaction')
@Controller('sale-transaction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
    private readonly saleTransactionReportService: SaleTransactionReportService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @HttpCode(HttpStatus.CREATED)
  async createSaleTransaction(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const formattedErrors = errors.map((error) => ({
            field: error.property,
            messages: Object.values(error.constraints || {}),
            children: error.children?.map((child) => ({
              field: `${error.property}.${child.property}`,
              messages: Object.values(child.constraints || {}),
            })),
          }));

          return new BadRequestException({
            message: 'Validation failed',
            errors: formattedErrors,
          });
        },
      }),
    )
    createSalesTransactionDto: CreateSalesTransactionDto,
  ) {
    return await this.saleTransactionService.createSaleTransaction(
      createSalesTransactionDto,
    );
  }

  @UseInterceptors(CacheInterceptor)
  @Get()
  @ApiOperation({
    summary: 'Get all sale transactions with optional filters & pagination',
  })
  async getAllSaleTransactions(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    )
    query: QuerySaleTransactionDto,
  ) {
    return await this.saleTransactionService.searchSaleTransactions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sale transaction statistics' })
  async getSaleTransactionStats(): Promise<{ totalTransactions: number }> {
    return await this.saleTransactionService.getSaleTransactionStats();
  }

  @Get('report/export')
  @ApiOperation({
    summary: 'Export sale transaction report to Excel',
  })
  async exportSaleTransactionReport(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    )
    query: QuerySaleTransactionReportDto,
    @Res() res: Response,
  ) {
    const buffer =
      await this.saleTransactionReportService.exportSaleTransactionReport(
        query,
      );

    const startDate = query.startDate || 'all';
    const endDate = query.endDate || 'all';

    const filename = `Transaction-report-${startDate}-to-${endDate}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale transaction by ID' })
  async getSaleTransactionById(
    @Param('id') id: string,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.getSaleTransactionById(id);
  }

  @Get('invoice-status')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get invoice statuses by transaction ids',
    description:
      'Used by frontend polling after invoice jobs are queued. Use this instead of calling GET /sale-transaction/:id many times.',
  })
  async getInvoiceStatuses(@Query('ids') ids: string) {
    return await this.saleTransactionService.getInvoiceStatuses(ids);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale transaction' })
  async updateSaleTransaction(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.updateSaleTransaction(
      id,
      updateData,
    );
  }

  @Patch(':id/mark-paid')
  @ApiOperation({
    summary: 'Mark sale transaction as paid',
    description:
      'Only issued invoices can be marked as paid. This endpoint updates bankId and sets isPaid=true.',
  })
  async markPaid(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: UpdateSaleTransactionBankDto,
  ) {
    return await this.saleTransactionService.markSaleTransactionPaid(
      id,
      body.bankId,
    );
  }

  @Patch(':id/mark-paid-test')
  @ApiOperation({
    summary: 'Update bank after invoice issued',
    description: 'Only bankId can be updated after invoiceStatus is ISSUED.',
  })
  async updateBankAfterInvoice(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: UpdateSaleTransactionBankDto,
  ) {
    return await this.saleTransactionService.updateTransactionBankAfterInvoice(
      id,
      body.bankId,
    );
  }

  @Patch(':id/cancel-invoice')
  @ApiOperation({
    summary: 'Cancel sale transaction invoice',
    description: 'Mark invoiceStatus as CANCELLED and set isActive to false.',
  })
  async cancelSaleTransactionInvoice(@Param('id') id: string) {
    return await this.saleTransactionService.cancelSaleTransactionInvoice(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sale transaction' })
  async deleteSaleTransaction(
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return await this.saleTransactionService.deleteSaleTransaction(id);
  }
}
