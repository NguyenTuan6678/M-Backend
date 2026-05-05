import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionDocument,
} from '../schemas/sale-transaction.schema';
import { Model } from 'mongoose';
import { CreateSalesTransactionDto } from '../dto/create-sale-transaction.req';

@Injectable()
export class SaleTransactionRepository {
  constructor(
    @InjectModel(SalesTransaction.name)
    private saleTransactionModel: Model<SalesTransactionDocument>,
    private readonly logger: LoggerService,
  ) {}

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SalesTransactionDocument> {
    try {
      const newTransaction = new this.saleTransactionModel(
        createSaleTransactionDto,
      );
      const savedTransaction = await newTransaction.save();
      this.logger.log(
        `Sale transaction created with ID: ${savedTransaction._id}`,
        'SaleTransactionRepository',
      );
      return savedTransaction;
    } catch (error: any) {
      this.logger.error(
        `Error creating sale transaction: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction by ID: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: SalesTransactionDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.saleTransactionModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.saleTransactionModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(
        `Error finding all sale transactions: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SalesTransactionDocument | null> {
    try {
      const updatedTransaction = await this.saleTransactionModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedTransaction) {
        this.logger.warn(
          `Sale transaction with ID: ${id} not found`,
          'SaleTransactionRepository',
        );
        return null;
      }
      this.logger.log(
        `Sale transaction updated with ID: ${updatedTransaction._id}`,
        'SaleTransactionRepository',
      );
      return updatedTransaction;
    } catch (error: any) {
      this.logger.error(
        `Error updating sale transaction: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel.findByIdAndDelete(id).exec();
    } catch (error: any) {
      this.logger.error(
        `Error deleting sale transaction: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.saleTransactionModel.countDocuments().exec();
    } catch (error: any) {
      this.logger.error(
        `Error counting sale transactions: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }
}
