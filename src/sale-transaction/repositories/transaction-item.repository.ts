import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  TransactionItem,
  TransactionItemDocument,
} from '../schemas/transaction-item.schema';
import { Model } from 'mongoose';
import { CreateTransactionItemDto } from '../dto/create-transaction-item.req';

@Injectable()
export class TransactionItemRepository {
  constructor(
    @InjectModel(TransactionItem.name)
    private transactionItemModel: Model<TransactionItemDocument>,
    private readonly logger: LoggerService,
  ) {}

  async createTransactionItem(
    createTransactionItemDto: CreateTransactionItemDto,
  ): Promise<TransactionItemDocument> {
    try {
      const newItem = new this.transactionItemModel(createTransactionItemDto);
      const savedItem = await newItem.save();
      this.logger.log(
        `Transaction item created with ID: ${savedItem._id}`,
        'TransactionItemRepository',
      );
      return savedItem;
    } catch (error: any) {
      this.logger.error(
        `Error creating transaction item: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }
}
