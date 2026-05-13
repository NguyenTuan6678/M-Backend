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
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';
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
import { Types } from 'mongoose';

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

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: fieldName,
            message: `${fieldName} must be a valid MongoDB ObjectId`,
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

  async getSaleTransactionById(
    id: string,
  ): Promise<SaleTransactionResponseDTO> {
    const transaction = await this.saleTransactionRepository.findById(id);
    if (!transaction) {
      this.logger.warn(`Sale transaction not found with ID: ${id}`);
      throw new Error('Sale transaction not found');
    }
    return this.mapToResponseDto(transaction);
  }

  async getAllSaleTransactions(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<SaleTransactionResponseDTO>> {
    const { data, total } = await this.saleTransactionRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((transaction) => this.mapToResponseDto(transaction)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateSaleTransaction(
    id: string,
    updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SaleTransactionResponseDTO> {
    const updatedTransaction = await this.saleTransactionRepository.update(
      id,
      updateData,
    );
    if (!updatedTransaction) {
      this.logger.warn(`Sale transaction not found for update with ID: ${id}`);
      throw new Error('Sale transaction not found');
    }
    return this.mapToResponseDto(updatedTransaction);
  }

  async deleteSaleTransaction(id: string): Promise<{ message: string }> {
    try {
      const deleted = await this.saleTransactionRepository.delete(id);
      if (!deleted) {
        this.logger.warn(
          `Sale transaction not found for deletion with ID: ${id}`,
        );
        return { message: 'Sale transaction not found' };
      }
      return { message: 'Sale transaction deleted successfully' };
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.deleteSaleTransaction: ${error.message}`,
      );
      throw error;
    }
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
