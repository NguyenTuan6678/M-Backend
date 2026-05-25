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
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SaleTransactionService } from '@module/sale-transaction/sale-transaction.service';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { SaleTransactionResponseDTO } from '@module/sale-transaction/dto/sale-transaction.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { MessageResponse } from '@app-types/message.res';
import { QuerySaleTransactionDto } from './dto/query-transaction.req';
import { UpdateSaleTransactionBankDto } from './dto/update-transaction-bank.req';

@ApiTags('Sale Transaction')
@Controller('sale-transaction')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CacheInterceptor)
@ApiBearerAuth('authorization')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
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

  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get sale transaction by ID' })
  async getSaleTransactionById(
    @Param('id') id: string,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.getSaleTransactionById(id);
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
