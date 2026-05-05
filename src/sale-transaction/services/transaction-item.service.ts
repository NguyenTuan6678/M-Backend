import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TransactionItem } from '../schemas/transaction-item.schema';
import { Model } from 'mongoose';
import { LoggerService } from '@common/logs/logger.service';
import { CreateTransactionItemDto } from '../dto/create-transaction-item.req';
import { TransactionItemDto } from '../dto/transaction-item.res';
import { TransactionItemRepository } from '../repositories/transaction-item.repository';
import { plainToClass } from 'class-transformer';

@Injectable()
export class TransactionItemService {
  constructor(
    @InjectModel(TransactionItem.name)
    private transactionItemModel: Model<TransactionItem>,
    private readonly transactionItemRepository: TransactionItemRepository,
    private readonly logger: LoggerService,
  ) {}

  async createTransactionItem(
    createTransactionItemDto: CreateTransactionItemDto,
  ): Promise<TransactionItemDto> {
    const existedItem = await this.transactionItemRepository.findById(
      createTransactionItemDto.productId,
    );
    if (existedItem) {
      throw new Error('Transaction item already exists');
    }
    const savedItem =
      await this.transactionItemRepository.createTransactionItem(
        createTransactionItemDto,
      );
    return this.mapToResponseDto(savedItem);
  }

  private mapToResponseDto(transactionItem: any): TransactionItemDto {
    return plainToClass(TransactionItemDto, transactionItem.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
