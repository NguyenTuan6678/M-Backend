import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionItemService } from '../services/transaction-item.service';
import { ApiOperation } from '@nestjs/swagger';
import { TransactionItemDto } from '../dto/transaction-item.res';
import { CreateTransactionItemDto } from '../dto/create-transaction-item.req';

@Controller('transaction-item')
export class TransactionItemController {
  constructor(
    private readonly transactionItemService: TransactionItemService,
  ) {}

  @Post(':create')
  @ApiOperation({ summary: 'Create a new transaction item' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createTransactionItemDto: CreateTransactionItemDto,
  ): Promise<TransactionItemDto> {
    return this.transactionItemService.createTransactionItem(
      createTransactionItemDto,
    );
  }
}
