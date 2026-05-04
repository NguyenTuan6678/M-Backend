import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '../repositories/sale-transaction.repository';
import { CreateSalesTransactionDto } from '../dto/create-sale-transaction.dto';
import { CreateSalesTransactionResponseDto } from '../dto/create-sale-transaction.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';

@Injectable()
export class SaleTransactionService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly logger: LoggerService,
  ) {}

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<MessageResponse | null> {
    let response: CreateSalesTransactionResponseDto | null = null;
    try {
      const createdTransaction =
        await this.saleTransactionRepository.createSaleTransaction(
          createSaleTransactionDto,
        );
      response = {
        content: createdTransaction,
        code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction created successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.createSaleTransaction: ${error.message}`,
        undefined,
      );
      throw error;
    }
    return response;
  }

  async getSaleTransactionById(id: string): Promise<any> {
    try {
      const transaction = await this.saleTransactionRepository.findById(id);
      if (!transaction) {
        this.logger.warn(`Sale transaction not found with ID: ${id}`);
        return null;
      }
      return transaction;
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionById: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async getAllSaleTransactions(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: any[]; total: number }> {
    try {
      return await this.saleTransactionRepository.findAll(skip, limit);
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getAllSaleTransactions: ${error.message}`,
        undefined,
      );
      throw error;
    }
  }

  async updateSaleTransaction(
    id: string,
    updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<any> {
    try {
      const updatedTransaction = await this.saleTransactionRepository.update(
        id,
        updateData,
      );
      if (!updatedTransaction) {
        this.logger.warn(
          `Sale transaction not found for update with ID: ${id}`,
        );
        return null;
      }
      return updatedTransaction;
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.updateSaleTransaction: ${error.message}`,
        undefined,
      );
      throw error;
    }
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

  //   async getSaleTransactionsByEmployee(employeeId: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByEmployeeId(employeeId);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByEmployee: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByAgency(agencyId: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByAgencyId(agencyId);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByAgency: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByDepartment(departmentId: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByDepartmentId(departmentId);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByDepartment: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getPaidSaleTransactions(): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findPaidTransactions();
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getPaidSaleTransactions: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getUnpaidSaleTransactions(): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findUnpaidTransactions();
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getUnpaidSaleTransactions: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByDateRange(
  //     startDate: Date,
  //     endDate: Date,
  //   ): Promise<any[]> {
  //     try {
  //       const transactions = await this.saleTransactionRepository.findByDateRange(
  //         startDate,
  //         endDate,
  //       );
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByDateRange: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByTaxCode(taxCode: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByTaxCode(taxCode);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByTaxCode: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByCompanyName(companyName: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByCompanyName(companyName);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByCompanyName: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }

  //   async getSaleTransactionsByEmail(email: string): Promise<any[]> {
  //     try {
  //       const transactions =
  //         await this.saleTransactionRepository.findByEmail(email);
  //       return transactions;
  //     } catch (error: any) {
  //       this.logger.error(
  //         `Error in SaleTransactionService.getSaleTransactionsByEmail: ${error.message}`,
  //         undefined,
  //       );
  //       throw error;
  //     }
  //   }
}
