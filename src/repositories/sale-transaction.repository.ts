import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionDocument,
} from '@schemas/sale-transaction.schema';
import { Model, Types } from 'mongoose';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';

@Injectable()
export class SaleTransactionRepository {
  constructor(
    @InjectModel(SalesTransaction.name)
    private saleTransactionModel: Model<SalesTransactionDocument>,
    private readonly logger: LoggerService,
  ) {}

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SalesTransactionDocument | null> {
    try {
      const { agencyId, departmentId, employeeId, bankId, productId } =
        createSaleTransactionDto;
      if (!agencyId || !departmentId || !employeeId || !bankId || !productId) {
        this.logger.warn(
          'Missing required fields for sale transaction creation',
          'SaleTransactionRepository',
        );
        return null;
      }
      const dataSubmit = {
        ...createSaleTransactionDto,
        agencyId: new Types.ObjectId(agencyId),
        departmentId: new Types.ObjectId(departmentId),
        employeeId: new Types.ObjectId(employeeId),
        bankId: new Types.ObjectId(bankId),
        productId: new Types.ObjectId(productId),
      };
      const newSaleTransaction = new this.saleTransactionModel(dataSubmit);
      const savedTransaction = await newSaleTransaction.save();
      this.logger.log(
        `Sale transaction created with ID: ${savedTransaction._id}`,
        'SaleTransactionRepository',
      );
      return savedTransaction;
    } catch (error: any) {
      this.logger.error(
        `Error creating sale transaction: ${error.message}`,
        'SaleTransactionRepository',
      );
      return null;
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
          .populate('agencyId')
          .populate('departmentId')
          .populate('employeeId')
          .populate('bankId')
          .populate('productId')
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

  async findByEmployeeId(
    employeeId: string,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ employeeId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by employee ID: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByAgencyId(agencyId: string): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ agencyId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by agency ID: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByDepartmentId(
    departmentId: string,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ departmentId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by department ID: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findPaidTransactions(): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ isPaid: true })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding paid sale transactions: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findUnpaidTransactions(): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ isPaid: false })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding unpaid sale transactions: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({
          activationDate: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ activationDate: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by date range: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByTaxCode(taxCode: string): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ taxCode })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by tax code: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByCompanyName(
    companyName: string,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ companyName })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by company name: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ email })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by email: ${error.message}`,
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
