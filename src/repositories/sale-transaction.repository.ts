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

      if (!items?.length) {
        this.logger.warn(
          'Missing required field: items',
          'SaleTransactionRepository',
        );
        return null;
      }

      // Format datetime hiện tại theo pattern DD/MM/YYYY HH:mm:ss SA/CH
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const hours = now.getHours();
      const formattedNow = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(hours % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${hours < 12 ? 'SA' : 'CH'}`;

      const dataSubmit = {
        ...createSaleTransactionDto,
        // Nếu không truyền inv_invoiceIssuedDate thì lấy thời điểm hiện tại
        inv_invoiceIssuedDate:
          createSaleTransactionDto.inv_invoiceIssuedDate ?? formattedNow,
        // Chỉ convert sang ObjectId nếu field tồn tại (tất cả là optional)
        ...(agencyId && { agencyId: new Types.ObjectId(agencyId) }),
        ...(departmentId && { departmentId: new Types.ObjectId(departmentId) }),
        ...(employeeId && { employeeId: new Types.ObjectId(employeeId) }),
        ...(bankId && { bankId: new Types.ObjectId(bankId) }),
        items: items.map((item) => ({
          ...item,
          // productId là optional — chỉ convert nếu có
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
      return null;
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

  // Dùng cho buildInvoicePayload — cần full product data để mapper hoạt động
  async findByIdWithPopulate(
    id: string,
  ): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel
        .findById(id)
        .populate('agencyId')
        .populate('departmentId')
        .populate('employeeId')
        .populate('bankId')
        .populate({
          path: 'items.productId',
          select: 'name price taxRate accountCode',
        })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction with populate by ID: ${error.message}`,
        'SaleTransactionRepository',
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
          .populate({
            path: 'items.productId',
            select: 'name price taxRate accountCode',
          })
          .sort({ createdAt: -1 })
          .exec(),
        this.saleTransactionModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(
        `Error finding all sale transactions: ${error.message}`,
        'SaleTransactionRepository',
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
        .find({ employeeId })
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
        .find({ agencyId })
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
        .find({ departmentId })
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
