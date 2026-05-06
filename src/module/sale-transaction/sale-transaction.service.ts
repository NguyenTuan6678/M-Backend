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
    agencyId: string,
    departmentId: string,
    employeeId: string,
    bankId: string,
    productId: string,
  ) {
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
    if (productId) {
      promises.push(this.productRepository.findById(productId));
      entityNames.push('Product');
    }

    const results = await Promise.all(promises);

    const missingEntities: string[] = [];
    results.forEach((result, index) => {
      if (!result) {
        missingEntities.push(entityNames[index]);
      }
    });

    return missingEntities;
  }

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SaleTransactionResponseDTO | null> {
    try {
      const { agencyId, departmentId, employeeId, bankId, productId } =
        createSaleTransactionDto;

      if (!agencyId) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'The field agencyId is required',
        };
      }

      const missingEntities = await this.validateRelatedEntities(
        agencyId,
        departmentId,
        employeeId,
        bankId,
        productId,
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
        undefined,
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
        undefined,
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
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByEmployee: ${error.message}`,
        undefined,
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
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByAgency: ${error.message}`,
        undefined,
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
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByDepartment: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getPaidSaleTransactions(): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findPaidTransactions();
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getPaidSaleTransactions: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getUnpaidSaleTransactions(): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findUnpaidTransactions();
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getUnpaidSaleTransactions: ${error.message}`,
        undefined,
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
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByDateRange: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getSaleTransactionsByTaxCode(
    taxCode: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByTaxCode(taxCode);
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByTaxCode: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getSaleTransactionsByCompanyName(
    companyName: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByCompanyName(companyName);
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByCompanyName: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getSaleTransactionsByEmail(
    email: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    try {
      const transactions =
        await this.saleTransactionRepository.findByEmail(email);
      return transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      );
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionsByEmail: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  private mapToResponseDto(transaction: any): SaleTransactionResponseDTO {
    const response = new SaleTransactionResponseDTO();
    response.content = transaction.toObject();
    return response;
  }
}
