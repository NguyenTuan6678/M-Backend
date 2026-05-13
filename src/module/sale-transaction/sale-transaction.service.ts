import { LoggerService } from '@common/logs/logger.service';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { SaleTransactionResponseDTO } from '@module/sale-transaction/dto/sale-transaction.res';
import { AgencyRepository } from '@repositories/agency.repository';
import { DepartmentRepository } from '@repositories/department.repository';
import { EmployeeRepository } from '@repositories/employee.repository';
import { BankRepository } from '@repositories/bank.repository';
import { ProductRepository } from '@repositories/product.repository';
import { mapTransactionToInvoice } from '@module/sale-transaction/sale-transaction.mapper';
import { CreateInvoiceDto } from '../../api/m-invoice-receipt-post/dto/send-receipt.req';
import { Agency } from '@schemas/agency.schema';
import { Department } from '@schemas/department.schema';
import { Employee } from '@schemas/employee.schema';
import { Bank } from '@schemas/bank.schema';
import { Product } from '@schemas/product.schema';
import { Model, Types } from 'mongoose';
import { GetAllSaleTransactions } from './dto/get-all-sale-transaction.res';
import { InjectModel } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionDocument,
} from '@schemas/sale-transaction.schema';
import { MessageResponse } from '@app-types/message.res';

interface ValidatedEntities {
  missing: string[];
  agency?: Agency;
  department?: Department;
  employee?: Employee;
  bank?: Bank;
  products?: Product[];
}

@Injectable()
export class SaleTransactionService {
  constructor(
    @InjectModel(SalesTransaction.name)
    private transactionModel: Model<SalesTransactionDocument>,
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly agencyRepository: AgencyRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly bankRepository: BankRepository,
    private readonly productRepository: ProductRepository,
    private readonly logger: LoggerService,
  ) {}

  private async validateObjectId(fieldName: string, value?: string) {
    if (!value) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: fieldName,
            message: `${fieldName} is required`,
          },
        ],
      });
    }
  }

  private async validateRelatedEntities(
    agencyId: string | undefined,
    departmentId: string | undefined,
    employeeId: string | undefined,
    bankId: string | undefined,
    items: { productId?: string }[],
  ): Promise<ValidatedEntities> {
    const productIds = items
      ?.map((i) => i.productId)
      .filter((id): id is string => !!id);

    const [agency, department, employee, bank, products] = await Promise.all([
      agencyId ? this.agencyRepository.findById(agencyId) : undefined,
      departmentId
        ? this.departmentRepository.findById(departmentId)
        : undefined,
      employeeId ? this.employeeRepository.findById(employeeId) : undefined,
      bankId ? this.bankRepository.findById(bankId) : undefined,
      productIds?.length
        ? this.productRepository.findByIds(productIds)
        : undefined,
    ]);

    const missing: string[] = [];
    if (agencyId && !agency) missing.push('Agency');
    if (departmentId && !department) missing.push('Department');
    if (employeeId && !employee) missing.push('Employee');
    if (bankId && !bank) missing.push('Bank');
    if (productIds?.length && (!products || products.length === 0))
      missing.push('Products');

    return {
      missing,
      ...(agency && { agency }),
      ...(department && { department }),
      ...(employee && { employee }),
      ...(bank && { bank }),
      ...(products?.length && { products }),
    };
  }

  async createSaleTransaction(
    createSalesTransactionDto: CreateSalesTransactionDto,
  ) {
    try {
      const errors: { field: string; message: string }[] = [];

      const requiredObjectIds = [
        'agencyId',
        'departmentId',
        'employeeId',
        'bankId',
      ] as const;

      for (const field of requiredObjectIds) {
        const value = createSalesTransactionDto[field];

        if (!value) {
          errors.push({
            field,
            message: `${field} is required`,
          });
        } else if (!Types.ObjectId.isValid(value)) {
          errors.push({
            field,
            message: `${field} must be a valid MongoDB ObjectId`,
          });
        }
      }

      if (
        !createSalesTransactionDto.items ||
        !Array.isArray(createSalesTransactionDto.items) ||
        createSalesTransactionDto.items.length === 0
      ) {
        errors.push({
          field: 'items',
          message: 'items must contain at least one product item',
        });
      } else {
        createSalesTransactionDto.items.forEach((item, index) => {
          if (!item.productId) {
            errors.push({
              field: `items[${index}].productId`,
              message: `items[${index}].productId is required`,
            });
          } else if (!Types.ObjectId.isValid(item.productId)) {
            errors.push({
              field: `items[${index}].productId`,
              message: `items[${index}].productId must be a valid MongoDB ObjectId`,
            });
          }
        });
      }

      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'Create sale transaction failed',
          errors,
        });
      }

      const saleTransaction =
        await this.saleTransactionRepository.createSaleTransaction(
          createSalesTransactionDto,
        );

      return this.mapToResponseDto(saleTransaction);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Create sale transaction failed',
        detail: error.message,
      });
    }
  }

  async getAllSaleTransactions(): Promise<GetAllSaleTransactions> {
    let response: GetAllSaleTransactions | null = null;
    try {
      const saleTransactions = await this.transactionModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all agencies successfully',
        content: saleTransactions,
      };
      return response;
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async getSaleTransactionById(
    id: string,
  ): Promise<SaleTransactionResponseDTO> {
    let response: SaleTransactionResponseDTO | null = null;
    try {
      const transaction = await this.saleTransactionRepository.findById(id);

      if (!transaction) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency fetched successfully',
        content: transaction,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async updateSaleTransaction(
    id: string,
    updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SaleTransactionResponseDTO> {
    try {
      const updatedTransation = await this.saleTransactionRepository.update(
        id,
        updateData,
      );

      if (!updatedTransation) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
          content: updatedTransation || undefined,
        };
      }

      return {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency updated successfully',
        content: updatedTransation,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: undefined,
      };
    }
  }

  async deleteSaleTransaction(id: string): Promise<MessageResponse> {
    const deletedTransaction = await this.saleTransactionRepository.delete(id);
    if (!deletedTransaction) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Sale transaction with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: 'Sale transaction deleted successfully',
    };
  }

  async getSaleTransactionStats(): Promise<{ totalTransactions: number }> {
    try {
      const total = await this.saleTransactionRepository.countAll();
      return { totalTransactions: total };
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionStats: ${error.message}`,
      );
      throw error;
    }
  }

  async getSaleTransactionsByEmployee(
    employeeId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByEmployeeId(employeeId);
      return transactions.map((t) => this.mapToResponseDto(t));
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByEmployee: ${error.message}`,
      );
      throw error;
    }
  }

  async getSaleTransactionsByAgency(
    agencyId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByAgencyId(agencyId);
      return transactions.map((t) => this.mapToResponseDto(t));
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByAgency: ${error.message}`,
      );
      throw error;
    }
  }

  async getSaleTransactionsByDepartment(
    departmentId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByDepartmentId(departmentId);
      return transactions.map((t) => this.mapToResponseDto(t));
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByDepartment: ${error.message}`,
      );
      throw error;
    }
  }

  async getSaleTransactionsByBank(
    bankId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByBankId(bankId);
      return transactions.map((t) => this.mapToResponseDto(t));
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByDepartment: ${error.message}`,
      );
      throw error;
    }
  }

  async getSaleTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions = await this.saleTransactionRepository.findByDateRange(
        startDate,
        endDate,
      );
      return transactions.map((t) => this.mapToResponseDto(t));
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByDateRange: ${error.message}`,
      );
      throw error;
    }
  }

  async buildInvoicePayload(transactionId: string): Promise<CreateInvoiceDto> {
    try {
      const transaction =
        await this.saleTransactionRepository.findByIdWithPopulate(
          transactionId,
        );

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      return mapTransactionToInvoice(transaction as any);
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.buildInvoicePayload: ${error.message}`,
      );
      throw error;
    }
  }

  private mapToResponseDto(transaction: any): SaleTransactionResponseDTO {
    const response = new SaleTransactionResponseDTO();
    response.content = transaction.toObject
      ? transaction.toObject()
      : transaction;
    return response;
  }
}
