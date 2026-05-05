import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaleTransactionService } from '../services/sale-transaction.service';
import { create } from 'domain';
import { CreateSalesTransactionDto } from '../dto/create-sale-transaction.req';

@ApiTags('sale-transaction')
@Controller('sale-transaction')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @ApiResponse({
    status: 201,
    description: 'The sale transaction has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Missing required fields or invalid data.',
  })
  createSaleTransaction(
    @Body() createSaleTransactionDto: CreateSalesTransactionDto,
  ) {
    return this.saleTransactionService.createSaleTransaction(
      createSaleTransactionDto,
    );
  }
}
