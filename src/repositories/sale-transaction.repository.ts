import { LoggerService } from '@common/loggers/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionDocument,
} from '@schemas/sale-transaction.schema';
import { Model, Types } from 'mongoose';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { Counter, CounterDocument } from '@schemas/counter.schema';
import { UpdateSalesTransactionDto } from '@module/sale-transaction/dto/update-sale-transaction-repository.res';
import { QuerySaleTransactionDto } from '@module/sale-transaction/dto/query-transaction.req';
import { InvoiceStatus } from '@utils/transaction-status';
import { QuerySaleTransactionReportDto } from '@module/sale-transaction/dto/query-transaction-report.req';

type SaleTransactionUpdatePayload = Partial<UpdateSalesTransactionDto> & {
  isActive?: boolean;
  invoiceStatus?: InvoiceStatus;
  inv_invoiceCreatedId?: string;
  inv_invoiceSeries?: string;
  key_api?: string;
  invoiceNumber?: number;
  amountCollected?: number;
  inv_invoiceIssuedDate?: string;
  so_benh_an?: string;
  activationDate?: string;
  invoiceFilePath?: string;
};

type CreateSalesTransactionPayload = Omit<
  CreateSalesTransactionDto,
  'bankId'
> & {
  employeeId?: string;
  departmentId?: string;
};

const POPULATE_OPTIONS = [
  {
    path: 'agencyId',
    select: 'agencyNumber agencyName agencyEmail commissionPercent employeeId',
    populate: {
      path: 'employeeId',
      select: 'employeeName employeeEmail employeePhone departmentId',
      populate: {
        path: 'departmentId',
        select: 'departmentName departmentDescription',
      },
    },
  },
  {
    path: 'employeeId',
    select: 'employeeName employeeEmail employeePhone departmentId',
    populate: {
      path: 'departmentId',
      select: 'departmentName departmentDescription',
    },
  },
  {
    path: 'departmentId',
    select: 'departmentName departmentDescription',
  },
  {
    path: 'bankId',
    select: 'inv_buyerBankName',
  },
  {
    path: 'items.productId',
    select: 'inv_itemCode inv_itemName inv_unitCode inv_unitPrice ma_thue',
  },
];

@Injectable()
export class SaleTransactionRepository {
  constructor(
    @InjectModel(SalesTransaction.name)
    private saleTransactionModel: Model<SalesTransactionDocument>,
    private readonly logger: LoggerService,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  private async generateSaleTransactionNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'orderNumber' },
      { $inc: { seq: 1 } },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );

    if (!counter) {
      throw new Error('Failed to generate sale transaction number');
    }
    return `HD${String(counter.seq).padStart(4, '0')}`;
  }

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionPayload,
  ): Promise<SalesTransactionDocument | null> {
    try {
      const { agencyId, departmentId, employeeId, items } =
        createSaleTransactionDto;

      const orderNumber = await this.generateSaleTransactionNumber();

      const formattedNow = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });

      const dataSubmit = {
        ...createSaleTransactionDto,
        orderNumber,
        activationDate: createSaleTransactionDto.activationDate ?? formattedNow,

        ...(agencyId && { agencyId: new Types.ObjectId(agencyId) }),
        ...(departmentId && { departmentId: new Types.ObjectId(departmentId) }),
        ...(employeeId && { employeeId: new Types.ObjectId(employeeId) }),

        items: (items ?? []).map((item) => ({
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

  async findAllWithFilters(query: QuerySaleTransactionDto): Promise<{
    data: SalesTransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        agencyId,
        employeeId,
        departmentId,
        bankId,
        isActive,
        startDate,
        endDate,
        search,
      } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (agencyId) filter.agencyId = new Types.ObjectId(agencyId);
      if (employeeId) filter.employeeId = new Types.ObjectId(employeeId);
      if (departmentId) filter.departmentId = new Types.ObjectId(departmentId);
      if (bankId) filter.bankId = new Types.ObjectId(bankId);

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (startDate || endDate) {
        filter.createdAt = {};

        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { inv_buyerDisplayName: { $regex: safeSearch, $options: 'i' } },
          { inv_buyerTaxCode: { $regex: safeSearch, $options: 'i' } },
          { orderNumber: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.saleTransactionModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .populate(POPULATE_OPTIONS)
          .exec(),

        this.saleTransactionModel.countDocuments(filter).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions with filters: ${error.message}`,
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
    if (!Types.ObjectId.isValid(id)) {
      this.logger.error(`Invalid ObjectId: ${id}`, 'SaleTransactionRepository');
      return null;
    }

    try {
      return await this.saleTransactionModel
        .findById(id)
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction with populate: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findByInvoiceCreatedId(
    inv_invoiceCreatedId: string,
  ): Promise<SalesTransactionDocument | null> {
    try {
      return await this.saleTransactionModel
        .findOne({ inv_invoiceCreatedId })
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction by inv_invoiceCreatedId: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findExistingFailedInvoices(limit = 20) {
    try {
      return await this.saleTransactionModel
        .find({
          invoiceStatus: InvoiceStatus.FAILED,
          isActive: true,
        })
        .select(
          '_id orderNumber inv_buyerDisplayName inv_buyerTaxCode invoiceStatus updatedAt createdAt',
        )
        .sort({ updatedAt: -1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding existing failed invoices: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findInvoiceStatusesByIds(ids: string[]) {
    try {
      const validIds = ids.filter((id) => Types.ObjectId.isValid(id));

      if (!validIds.length) {
        return [];
      }

      return await this.saleTransactionModel
        .find({
          _id: {
            $in: validIds.map((id) => new Types.ObjectId(id)),
          },
        })
        .select(
          '_id orderNumber invoiceStatus inv_invoiceCreatedId inv_invoiceSeries inv_invoiceIssuedDate isPaid bankId updatedAt createdAt',
        )
        .populate({
          path: 'bankId',
          select: 'inv_buyerBankName isActive',
        })
        .sort({ updatedAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding invoice statuses by ids: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findForReport(query: QuerySaleTransactionReportDto) {
    try {
      const {
        startDate,
        endDate,
        invoiceStatus,
        isPaid,
        agencyId,
        employeeId,
        departmentId,
        bankId,
        reportType,
      } = query;

      const filter: Record<string, any> = {};

      if (reportType === 'unpaid') {
        filter.invoiceStatus = InvoiceStatus.ISSUED;
        filter.isPaid = false;
      } else if (reportType === 'draft_paid') {
        filter.invoiceStatus = InvoiceStatus.DRAFT;
        filter.$or = [{ isPaid: true }, { amountCollected: { $gt: 0 } }];
      } else {
        if (invoiceStatus) {
          filter.invoiceStatus = invoiceStatus;
        } else {
          filter.invoiceStatus = InvoiceStatus.ISSUED;
        }

        if (isPaid !== undefined) {
          filter.isPaid = isPaid;
        }
      }

      if (agencyId) {
        filter.agencyId = new Types.ObjectId(agencyId);
      }

      if (employeeId) {
        filter.employeeId = new Types.ObjectId(employeeId);
      }

      if (departmentId) {
        filter.departmentId = new Types.ObjectId(departmentId);
      }

      if (bankId) {
        filter.bankId = new Types.ObjectId(bankId);
      }

      if (startDate || endDate) {
        const isDraftReport =
          reportType === 'draft_paid' || invoiceStatus === InvoiceStatus.DRAFT;

        if (isDraftReport) {
          filter.activationDate = {};

          if (startDate) {
            filter.activationDate.$gte = startDate;
          }

          if (endDate) {
            filter.activationDate.$lte = endDate;
          }
        } else {
          filter.inv_invoiceIssuedDate = {};

          if (startDate) {
            filter.inv_invoiceIssuedDate.$gte = startDate;
          }

          if (endDate) {
            filter.inv_invoiceIssuedDate.$lte = `${endDate}T23:59:59.999`;
          }
        }
      }

      const results = await this.saleTransactionModel
        .find(filter)
        .populate(POPULATE_OPTIONS)
        .sort({
          inv_invoiceIssuedDate: 1,
          createdAt: 1,
        })
        .exec();

      console.log('--- FIND FOR REPORT DIAGNOSTIC ---');
      console.log('Query:', JSON.stringify(query));
      console.log('Filter:', JSON.stringify(filter));
      console.log('Matched documents count:', results.length);
      if (results.length > 0) {
        console.log(
          'Sample matching document:',
          JSON.stringify({
            _id: results[0]._id,
            orderNumber: results[0].orderNumber,
            invoiceStatus: results[0].invoiceStatus,
            isPaid: results[0].isPaid,
            activationDate: results[0].activationDate,
            inv_invoiceIssuedDate: results[0].inv_invoiceIssuedDate,
          }),
        );
      }

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transactions for report: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async markInvoiceCanceled(
    id: string,
  ): Promise<SalesTransactionDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.error(
          `Invalid transaction ObjectId: ${id}`,
          'SaleTransactionRepository',
        );
        return null;
      }

      return await this.saleTransactionModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              invoiceStatus: InvoiceStatus.CANCELLED,
              isActive: false,
              isPaid: false,
            },
          },
          {
            returnDocument: 'after',
            runValidators: true,
          },
        )
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error canceling sale transaction invoice: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async markPaidWithBank(
    id: string,
    bankId: string,
    amountCollected?: number,
  ): Promise<SalesTransactionDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.error(
          `Invalid transaction ObjectId: ${id}`,
          'SaleTransactionRepository',
        );
        return null;
      }

      if (!Types.ObjectId.isValid(bankId)) {
        this.logger.error(
          `Invalid bank ObjectId: ${bankId}`,
          'SaleTransactionRepository',
        );
        return null;
      }

      return await this.saleTransactionModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              bankId: new Types.ObjectId(bankId),
              ...(amountCollected !== undefined && {
                amountCollected,
              }),
              isPaid: true,
            },
          },
          {
            returnDocument: 'after',
            runValidators: true,
          },
        )
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error marking sale transaction as paid: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async markStuckIssuingInvoicesFailed(minutes: number): Promise<{
    matched: number;
    updated: number;
    invoices: Array<{
      id: string;
      orderNumber?: string;
      inv_buyerDisplayName?: string;
      updatedAt?: Date;
    }>;
  }> {
    try {
      const thresholdDate = new Date(Date.now() - minutes * 60 * 1000);

      const stuckInvoices = await this.saleTransactionModel
        .find({
          invoiceStatus: InvoiceStatus.ISSUING,
          updatedAt: { $lte: thresholdDate },
        })
        .select('_id orderNumber inv_buyerDisplayName updatedAt')
        .sort({ updatedAt: 1 })
        .limit(100)
        .exec();

      if (!stuckInvoices.length) {
        return {
          matched: 0,
          updated: 0,
          invoices: [],
        };
      }

      const ids = stuckInvoices.map((invoice: any) => invoice._id);

      const result = await this.saleTransactionModel
        .updateMany(
          {
            _id: { $in: ids },
            invoiceStatus: InvoiceStatus.ISSUING,
          },
          {
            $set: {
              invoiceStatus: InvoiceStatus.FAILED,
              isActive: true,
            },
          },
        )
        .exec();

      return {
        matched: stuckInvoices.length,
        updated: result.modifiedCount ?? 0,
        invoices: stuckInvoices.map((invoice: any) => ({
          id: String(invoice._id),
          orderNumber: invoice.orderNumber,
          inv_buyerDisplayName: invoice.inv_buyerDisplayName,
          updatedAt: invoice.updatedAt,
        })),
      };
    } catch (error: any) {
      this.logger.error(
        `Error marking stuck ISSUING invoices as FAILED: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async countFailedInvoicesRecently(minutes: number): Promise<number> {
    const thresholdDate = new Date(Date.now() - minutes * 60 * 1000);

    return await this.saleTransactionModel
      .countDocuments({
        invoiceStatus: InvoiceStatus.FAILED,
        updatedAt: { $gte: thresholdDate },
      })
      .exec();
  }

  async countIssuedWithoutCreatedId(): Promise<number> {
    return await this.saleTransactionModel
      .countDocuments({
        invoiceStatus: InvoiceStatus.ISSUED,
        $or: [
          { inv_invoiceCreatedId: { $exists: false } },
          { inv_invoiceCreatedId: null },
          { inv_invoiceCreatedId: '' },
        ],
      })
      .exec();
  }

  async countCreatedIdButNotIssued(): Promise<number> {
    return await this.saleTransactionModel
      .countDocuments({
        inv_invoiceCreatedId: {
          $exists: true,
          $nin: [null, ''],
        },
        invoiceStatus: { $ne: InvoiceStatus.ISSUED },
      })
      .exec();
  }

  async update(
    id: string,
    updateData: SaleTransactionUpdatePayload,
  ): Promise<SalesTransactionDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.error(
          `Invalid transaction ObjectId: ${id}`,
          'SaleTransactionRepository',
        );
        return null;
      }

      const updatedTransaction = await this.saleTransactionModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateData,
          },
          {
            returnDocument: 'after',
            runValidators: true,
          },
        )
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

  async countIssuedInvoices(): Promise<number> {
    try {
      return await this.saleTransactionModel
        .countDocuments({
          invoiceStatus: InvoiceStatus.ISSUED,
        })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error counting issued invoices: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }
}
