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

  async findById(id: string): Promise<BankDocument | null> {
    try {
      return await this.bankModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding bank by ID: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: BankDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.bankModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.bankModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error fetching banks: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateBankDto>,
  ): Promise<BankDocument | null> {
    try {
      return await this.bankModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
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
