import { QueryBankDto } from '@module/bank/dto/query-bank.req';
import { CreateBankDto } from '../module/bank/dto/create-bank.req';
import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bank, BankDocument } from '@schemas/bank.schema';
import { Model } from 'mongoose';

@Injectable()
export class BankRepository {
  constructor(
    @InjectModel(Bank.name) private bankModel: Model<BankDocument>,
    private logger: LoggerService,
  ) {}

  async create(createBankDto: CreateBankDto): Promise<BankDocument> {
    try {
      const newBank = new this.bankModel(createBankDto);
      const savedBank = await newBank.save();
      this.logger.log(
        `Bank created: ${savedBank.inv_buyerBankName}`,
        'BankRepository',
      );
      return savedBank;
    } catch (error: any) {
      this.logger.error(`Error creating bank: ${error.message}`, undefined);
      throw error;
    }
  }

  async findAllWithFilters(query: QueryBankDto): Promise<{
    data: BankDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { isActive, search } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          {
            inv_buyerBankName: {
              $regex: safeSearch,
              $options: 'i',
            },
          },
        ];
      }

      const [data, total] = await Promise.all([
        this.bankModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.bankModel.countDocuments(filter).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error(`Error finding banks with filters: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<BankDocument | null> {
    try {
      return await this.bankModel
        .findById(id)
        .populate('inv_buyerBankName')
        .exec();
    } catch (error: any) {
      this.logger.error(`Error finding bank by ID: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateBankDto>,
  ): Promise<BankDocument | null> {
    try {
      const updateBank = await this.bankModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (updateBank) {
        this.logger.error('Bank updated succesfully', 'BankRepository');
      }
      return updateBank;
    } catch (error: any) {
      this.logger.error(`Error updating bank: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<BankDocument | null> {
    try {
      const deletedBank = await this.bankModel.findByIdAndDelete(id).exec();
      if (deletedBank) {
        this.logger.log(
          `Bank deleted: ${deletedBank.inv_buyerBankName}`,
          'BankRepository',
        );
      }
      return deletedBank;
    } catch (error: any) {
      this.logger.error(`Error deleting bank: ${error.message}`);
      throw error;
    }
  }
}
