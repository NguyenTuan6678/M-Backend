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
      const { agencyId, departmentId, employeeId, bankId, items } =
        createSaleTransactionDto;

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const hours = now.getHours();
      const formattedNow = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(hours % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${hours < 12 ? 'SA' : 'CH'}`;

      const dataSubmit = {
        ...createSaleTransactionDto,
        inv_invoiceIssuedDate:
          createSaleTransactionDto.inv_invoiceIssuedDate ?? formattedNow,
        ...(agencyId && { agencyId: new Types.ObjectId(agencyId) }),
        ...(departmentId && { departmentId: new Types.ObjectId(departmentId) }),
        ...(employeeId && { employeeId: new Types.ObjectId(employeeId) }),
        ...(bankId && { bankId: new Types.ObjectId(bankId) }),
        items: items.map((item) => ({
          ...item,
          ...(item.productId && {
            productId: new Types.ObjectId(item.productId),
          }),
        })),
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
      throw error;
    }
  }

  async findById(id: string): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction by ID: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByIdWithPopulate(
    id: string,
  ): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel
        .findById(id)
        .populate({ path: 'agencyId', select: 'name commissionPercent' })
        .populate({
          path: 'departmentId',
          select: 'departmentName departmentDescription',
        })
        .populate({
          path: 'employeeId',
          select: 'employeeName employeeEmail employeePhone ',
        })
        .populate({ path: 'bankId', select: 'inv_buyerBankName' })
        .populate({
          path: 'items.productId',
          select:
            'inv_itemCode inv_itemName inv_unitCode inv_unitPrice ma_thue inv_quantity inv_discountAmount inv_TotalAmountWithoutVat inv_vatAmount inv_TotalAmount',
        })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction with populate: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(skip = 0, limit = 10) {
    const [data, total] = await Promise.all([
      this.saleTransactionModel
        .find()
        .skip(skip)
        .limit(limit)
        .populate('agencyId')
        .populate('departmentId')
        .populate('employeeId')
        .populate('bankId')
        .populate({
          path: 'items.productId',
          select:
            'inv_itemCode inv_itemName inv_unitCode inv_unitPrice ma_thue inv_quantity inv_discountAmount inv_TotalAmountWithoutVat inv_vatAmount inv_TotalAmount',
        })
        .sort({ createdAt: -1 })
        .exec(),
      this.saleTransactionModel.countDocuments().exec(),
    ]);
    return { data, total };
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
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByEmployeeId(
    employeeId: string,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ employeeId: new Types.ObjectId(employeeId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by employee ID: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByAgencyId(agencyId: string): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ agencyId: new Types.ObjectId(agencyId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by agency ID: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByDepartmentId(
    departmentId: string,
  ): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ departmentId: new Types.ObjectId(departmentId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by department ID: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByBankId(bankId: string): Promise<SalesTransactionDocument[]> {
    try {
      return await this.saleTransactionModel
        .find({ bankId: new Types.ObjectId(bankId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by bank ID: ${error.message}`,
        'SaleTransactionRepository',
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
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions by date range: ${error.message}`,
        'SaleTransactionRepository',
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
        'SaleTransactionRepository',
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
        'SaleTransactionRepository',
      );
      throw error;
    }
  }
}
