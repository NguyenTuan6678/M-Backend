import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { SaleTransactionResponseDTO } from '@module/sale-transaction/dto/sale-transaction.res';
import { AgencyRepository } from '@repositories/agency.repository';
import { EmployeeRepository } from '@repositories/employee.repository';
import { BankRepository } from '@repositories/bank.repository';
import { ProductRepository } from '@repositories/product.repository';
import { mapTransactionToInvoice } from '@module/sale-transaction/sale-transaction.mapper';
import { CreateInvoiceDto } from '../../api/m-invoice-receipt-post/dto/send-receipt.req';
import { Agency } from '@schemas/agency.schema';
import { Bank } from '@schemas/bank.schema';
import { Product } from '@schemas/product.schema';
import { GetAllSaleTransactions } from './dto/get-all-sale-transaction.res';
import { MessageResponse } from '@app-types/message.res';
import { QuerySaleTransactionDto } from './dto/query-transaction.req';

interface ValidatedEntities {
  missing: string[];
  agency?: Agency;
  bank?: Bank;
  products?: Product[];
}

@Injectable()
export class SaleTransactionService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly agencyRepository: AgencyRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly bankRepository: BankRepository,
    private readonly productRepository: ProductRepository,
    private readonly logger: LoggerService,
  ) {}

  private async validateRelatedEntities(
    bankId: string | undefined,
    items: { productId?: string }[],
  ): Promise<ValidatedEntities> {
    const productIds = items
      ?.map((i) => i.productId)
      .filter((id): id is string => !!id);

    const [bank, products] = await Promise.all([
      bankId ? this.bankRepository.findById(bankId) : undefined,
      productIds?.length
        ? this.productRepository.findByIds(productIds)
        : undefined,
    ]);

    const missing: string[] = [];
    if (bankId && !bank) missing.push('Bank');
    if (productIds?.length && (!products || products.length === 0))
      missing.push('Products');

    return {
      missing,
      ...(bank && { bank }),
      ...(products?.length && { products }),
    };
  }

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SaleTransactionResponseDTO | null> {
    try {
      const { agencyId, bankId, items } = createSaleTransactionDto;

      const agency = agencyId
        ? await this.agencyRepository.findById(agencyId)
        : null;

      if (agencyId && !agency) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Agency not found',
        };
      }

      const populatedEmployee = (agency?.employeeId as any) || null;

      const employeeId = this.extractObjectId(populatedEmployee);

      const departmentId =
        this.extractObjectId(populatedEmployee?.departmentId) || undefined;

      let employee: any = null;

      if (employeeId) {
        employee =
          populatedEmployee && populatedEmployee.employeeName
            ? populatedEmployee
            : await this.employeeRepository.findById(employeeId);
      }

      const finalDepartmentId =
        departmentId || this.extractObjectId(employee?.departmentId);

      const { missing, bank, products } = await this.validateRelatedEntities(
        bankId,
        items ?? [],
      );

      if (!employeeId) {
        missing.push('Employee');
      }

      if (!finalDepartmentId) {
        missing.push('Department');
      }

      if (missing.length > 0) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Missing entities: ${missing.join(', ')}`,
        };
      }

      this.logger.log(
        `Validated — Agency: ${agency?.agencyName}, Employee: ${employee?.employeeName}, Department: ${finalDepartmentId}, Bank: ${bank?.inv_buyerBankName}, Products: ${products?.map((p) => p.inv_itemCode).join(', ')}`,
        'SaleTransactionService',
      );

      const createdTransaction =
        await this.saleTransactionRepository.createSaleTransaction({
          ...createSaleTransactionDto,
          employeeId,
          departmentId: finalDepartmentId,
        });

      if (!createdTransaction) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields or creation failed',
        };
      }

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction created successfully',
        content: createdTransaction,
      };
    } catch (error: any) {
      this.logger.error(`Error creating sale transaction: ${error.message}`);
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while creating transaction: ${error.message}`,
      };
    }
  }

  async getAllSaleTransactions(): Promise<GetAllSaleTransactions> {
    let response: GetAllSaleTransactions | null = null;
    try {
      const saleTransactions =
        await this.saleTransactionRepository.findAllWithPopulate();
      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all sale transactions successfully',
        content: saleTransactions,
      };
      return response;
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting all transaction: ${error.message}`,
      };
    }
    return response;
  }

  async getSaleTransactionById(
    id: string,
  ): Promise<SaleTransactionResponseDTO> {
    let response: SaleTransactionResponseDTO | null = null;
    try {
      const transaction =
        await this.saleTransactionRepository.findByIdWithPopulate(id);

      if (!transaction) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
        };
      }

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction fetched successfully',
        content: transaction,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting transaction by id: ${error.message}`,
      };
    }
    return response;
  }

  async updateSaleTransaction(
    id: string,
    updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SaleTransactionResponseDTO> {
    try {
      const updatedTransaction = await this.saleTransactionRepository.update(
        id,
        updateData,
      );

      if (!updatedTransaction) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
        };
      }

      const populatedTransaction =
        await this.saleTransactionRepository.findByIdWithPopulate(id);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction updated successfully',
        content: populatedTransaction || updatedTransaction,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while updating sale transaction: ${error.message}`,
      };
    }
  }

  async deleteSaleTransaction(id: string): Promise<MessageResponse> {
    const deletedTransaction = await this.saleTransactionRepository.delete(id);
    if (!deletedTransaction) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Sale transaction with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
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
        `Error in SaleTransactionService.getSaleTransactionsByBank: ${error.message}`,
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

  async searchSaleTransactions(query: QuerySaleTransactionDto) {
    try {
      const result =
        await this.saleTransactionRepository.findAllWithFilters(query);
      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transactions fetched successfully',
        ...result,
      };
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.searchSaleTransactions: ${error.message}`,
      );
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Threse is a problem while searching transaction: ${error.message}`,
      };
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

  private extractObjectId(value: any): string | undefined {
    if (!value) return undefined;

    if (typeof value === 'string') {
      return Types.ObjectId.isValid(value) ? value : undefined;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (value._id) {
      const id = value._id.toString();
      return Types.ObjectId.isValid(id) ? id : undefined;
    }

    return undefined;
  }

  private mapToResponseDto(transaction: any): SaleTransactionResponseDTO {
    const response = new SaleTransactionResponseDTO();
    response.content = transaction.toObject
      ? transaction.toObject()
      : transaction;
    return response;
  }
}
