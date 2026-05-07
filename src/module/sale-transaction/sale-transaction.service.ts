import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
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

  private async validateRelatedEntities(
    agencyId: string | undefined,
    departmentId: string | undefined,
    employeeId: string | undefined,
    bankId: string | undefined,
    items: { productId?: string }[],
  ): Promise<string[]> {
    const promises: Promise<any>[] = [];
    const entityNames: string[] = [];

    if (agencyId) {
      promises.push(this.agencyRepository.findById(agencyId));
      entityNames.push('Agency');
    }

    if (departmentId) {
      promises.push(this.departmentRepository.findById(departmentId));
      entityNames.push('Department');
    }

    if (employeeId) {
      promises.push(this.employeeRepository.findById(employeeId));
      entityNames.push('Employee');
    }

    if (bankId) {
      promises.push(this.bankRepository.findById(bankId));
      entityNames.push('Bank');
    }

    // productId là optional — chỉ validate những item có productId
    const productIds = items
      ?.map((i) => i.productId)
      .filter((id): id is string => !!id);

    if (productIds?.length) {
      promises.push(this.productRepository.findByIds(productIds));
      entityNames.push('Products');
    }

    const results = await Promise.all(promises);

    const missingEntities: string[] = [];
    results.forEach((result, index) => {
      if (!result || (Array.isArray(result) && result.length === 0)) {
        missingEntities.push(entityNames[index]);
      }
    });

    return missingEntities;
  }

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SaleTransactionResponseDTO | null> {
    try {
      const { agencyId, departmentId, employeeId, bankId, items } =
        createSaleTransactionDto;

      const missingEntities = await this.validateRelatedEntities(
        agencyId,
        departmentId,
        employeeId,
        bankId,
        items,
      );

      if (missingEntities.length > 0) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Missing entities: ${missingEntities.join(', ')}`,
        };
      }

      const createdTransaction =
        await this.saleTransactionRepository.createSaleTransaction(
          createSaleTransactionDto,
        );

      if (!createdTransaction) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields or creation failed',
        };
      }

      return {
        content: createdTransaction,
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction created successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error creating sale transaction: ${error.message}`);
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'An error occurred while creating the sale transaction',
      };
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

  // Fetch transaction, populate product data, map sang CreateInvoiceDto để gửi hoá đơn
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
