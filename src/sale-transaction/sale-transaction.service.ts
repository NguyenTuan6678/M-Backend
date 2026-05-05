import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { CreateSalesTransactionDto } from '@transaction/dto/create-sale-transaction.req';
import { CreateSalesTransactionResponseDto } from '@transaction/dto/create-sale-transaction.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';
import { SaleTransactionResponseDTO } from '@transaction/dto/sale-transaction.res';
import { plainToClass } from 'class-transformer';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';

@Injectable()
export class SaleTransactionService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly logger: LoggerService,
  ) {}

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<CreateSalesTransactionResponseDto | null> {
    try {
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
    createSalesTransactionDto: CreateSalesTransactionDto,
  ): Promise<MessageResponse | null> {
    let response: MessageResponse | null = null;
    try {
      const transaction =
        await this.saleTransactionRepository.createSaleTransaction(
          createSalesTransactionDto,
        );
      if (!transaction) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Sale transaction not found',
        };
        return response;
      }
      response = {
        code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction retrieved successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
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

  private mapToResponseDto(transaction: any): SaleTransactionResponseDTO {
    return plainToClass(SaleTransactionResponseDTO, transaction.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
