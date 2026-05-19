import { LoggerService } from '@common/logs/logger.service';
import { CreateEmployeeDto } from '../module/employee/dto/create.employee.req';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReceiptInvoice,
  ReceiptInvoiceDocument,
} from '@schemas/receiptinvoice.schema';
import { CreateReceiptInvoiceDto } from '@module/receiptinvoice/dto/create-receiptinvoice.req';

@Injectable()
export class ReceiptInvoiceRepository {
  constructor(
    @InjectModel(ReceiptInvoice.name)
    private receiptModel: Model<ReceiptInvoiceDocument>,
    private logger: LoggerService,
  ) {}

  async create(
    createReceiptDto: CreateReceiptInvoiceDto,
  ): Promise<ReceiptInvoiceDocument> {
    try {
      const newReceipt = new this.receiptModel(createReceiptDto);
      const savedReceipt = await newReceipt.save();
      this.logger.log(
        `ReceiptInvoice created: ${savedReceipt.inv_invoiceSeries}`,
        'BankRepository',
      );
      return savedReceipt;
    } catch (error: any) {
      this.logger.error(
        `Error creating receiptinvoice: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async findAll(): Promise<ReceiptInvoiceDocument[]> {
    try {
      return await this.receiptModel.find().sort({ createdAt: -1 }).exec();
    } catch (error: any) {
      this.logger.error(`Error fetching receiptinvoices: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<ReceiptInvoiceDocument | null> {
    try {
      return await this.receiptModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding receiptinvoice by ID: ${error.message}`);
      throw error;
    }
  }

  async findByTaxCode(
    tax_code: string,
  ): Promise<ReceiptInvoiceDocument | null> {
    try {
      return await this.receiptModel.findOne({ tax_code }).exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding receiptinvoice by tax_code: ${error.message}`,
      );
      throw error;
    }
  }

  async searchByName(
    keyword: string,
    skip = 0,
    limit = 10,
  ): Promise<{ data: ReceiptInvoiceDocument[]; total: number }> {
    try {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const filter = {
        employeeName: {
          $regex: safeKeyword,
          $options: 'i',
        },
      };

      const [data, total] = await Promise.all([
        this.receiptModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.receiptModel.countDocuments(filter).exec(),
      ]);

      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error searching employee by name: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateReceiptInvoiceDto>,
  ): Promise<ReceiptInvoiceDocument | null> {
    try {
      return await this.receiptModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error updating employee: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<ReceiptInvoiceDocument | null> {
    try {
      const deletedReceipt = await this.receiptModel
        .findByIdAndDelete(id)
        .exec();
      if (deletedReceipt) {
        this.logger.log(
          `Employee deleted: ${deletedReceipt.inv_invoiceSeries}`,
          'EmployeeRepository',
        );
      }
      return deletedReceipt;
    } catch (error: any) {
      this.logger.error(`Error deleting employee: ${error.message}`);
      throw error;
    }
  }
}
