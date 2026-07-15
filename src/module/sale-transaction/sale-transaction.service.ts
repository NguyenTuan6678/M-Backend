import { LoggerService } from '@common/loggers/logger.service';
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
import { Agency } from '@schemas/agency.schema';
import { Product } from '@schemas/product.schema';
import { MessageResponse } from '@app-types/message.res';
import { QuerySaleTransactionDto } from './dto/query-transaction.req';
import { DepartmentRepository } from '@repositories/department.repository';
import { AuditLogService } from '@common/audit/audit-log.service';
import { Role } from '@utils/role.enum';
import { AuditAction } from '@common/audit/audit-action.enum';
import { UpdateTransactionDto } from './dto/update-sale-transaction.req';

interface ValidatedEntities {
  missing: string[];
  inactive: string[];
  agency?: Agency;
  employee?: any;
  department?: any;
  products?: Product[];
}

@Injectable()
export class SaleTransactionService {
  constructor(
    private readonly saleTransactionRepository: SaleTransactionRepository,
    private readonly agencyRepository: AgencyRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly bankRepository: BankRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly productRepository: ProductRepository,
    private readonly logger: LoggerService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async validateRelatedEntities(
    agencyId: string | undefined,
    employeeIdFromClient: string | undefined,
    items: { productId?: string }[],
  ): Promise<ValidatedEntities> {
    const missing: string[] = [];
    const inactive: string[] = [];

    let agency: any = null;
    let employee: any = null;
    let department: any = null;
    let products: Product[] = [];

    if (!agencyId || !Types.ObjectId.isValid(agencyId)) {
      missing.push('Agency');
    } else {
      agency = await this.agencyRepository.findById(agencyId);

      if (!agency) {
        missing.push('Agency');
      } else if (agency.isActive === false) {
        inactive.push('Agency');
      }
    }

    const agencyEmployeeId = this.extractObjectId((agency as any)?.employeeId);

    const selectedEmployeeId =
      employeeIdFromClient && Types.ObjectId.isValid(employeeIdFromClient)
        ? employeeIdFromClient
        : agencyEmployeeId;

    if (!selectedEmployeeId) {
      missing.push('Employee');
    } else {
      employee = await this.employeeRepository.findById(selectedEmployeeId);

      if (!employee) {
        missing.push('Employee');
      } else if (employee.isActive === false) {
        inactive.push('Employee');
      }
    }

    const departmentId = this.extractObjectId((employee as any)?.departmentId);

    if (!departmentId) {
      missing.push('Department');
    } else {
      department = await this.departmentRepository.findById(departmentId);

      if (!department) {
        missing.push('Department');
      } else if (department.isActive === false) {
        inactive.push('Department');
      }
    }

    const productIds = items
      ?.map((i) => i.productId)
      .filter((id): id is string => !!id);

    if (!productIds?.length) {
      missing.push('Products');
    } else {
      const invalidProductIds = productIds.filter(
        (id) => !Types.ObjectId.isValid(id),
      );

      if (invalidProductIds.length > 0) {
        missing.push(`Invalid productIds: ${invalidProductIds.join(', ')}`);
      }

      products = await this.productRepository.findByIds(productIds);

      const foundProductIds = new Set(
        products.map((product: any) => String(product._id)),
      );

      const missingProductIds = productIds.filter(
        (productId) => !foundProductIds.has(productId),
      );

      if (missingProductIds.length > 0) {
        missing.push(`Products: ${missingProductIds.join(', ')}`);
      }

      const inactiveProducts = products.filter(
        (product: any) => product.isActive === false,
      );

      if (inactiveProducts.length > 0) {
        inactive.push(
          `Products: ${inactiveProducts
            .map((product: any) => product.inv_itemCode || product._id)
            .join(', ')}`,
        );
      }
    }

    return {
      missing,
      inactive,
      ...(agency && { agency }),
      ...(employee && { employee }),
      ...(department && { department }),
      ...(products?.length && { products }),
    };
  }

  async createSaleTransaction(
    createSaleTransactionDto: CreateSalesTransactionDto,
  ): Promise<SaleTransactionResponseDTO | null> {
    try {
      const { agencyId, employeeId, items } = createSaleTransactionDto;

      const { missing, inactive, agency, employee, department, products } =
        await this.validateRelatedEntities(agencyId, employeeId, items ?? []);

      if (missing.length > 0) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Missing entities: ${missing.join(', ')}`,
        };
      }

      if (inactive.length > 0) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Inactive entities cannot be used: ${inactive.join(', ')}`,
        };
      }

      const finalEmployeeId = this.extractObjectId((employee as any)?._id);
      const finalDepartmentId = this.extractObjectId((department as any)?._id);

      if (!finalEmployeeId) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Employee is invalid or inactive',
        };
      }

      if (!finalDepartmentId) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Department is invalid or inactive',
        };
      }

      this.logger.log(
        `Validated — Agency: ${(agency as any)?.agencyName}, Employee: ${(employee as any)?.employeeName}, Department: ${(department as any)?.departmentName}, Products: ${products
          ?.map((p: any) => p.inv_itemCode)
          .join(', ')}`,
        'SaleTransactionService',
      );

      const createdTransaction =
        await this.saleTransactionRepository.createSaleTransaction({
          ...createSaleTransactionDto,

          employeeId: finalEmployeeId,
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
        message: `There is a problem while searching transaction: ${error.message}`,
      };
    }
  }

  async getSaleTransactionById(
    id: string,
  ): Promise<SaleTransactionResponseDTO> {
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

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction fetched successfully',
        content: transaction,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting transaction by id: ${error.message}`,
      };
    }
  }

  async markSaleTransactionPaid(
    transactionId: string,
    bankId: string,
    amountCollected?: number,
  ) {
    const transaction =
      await this.saleTransactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error(`Sale transaction with ID ${transactionId} not found`);
    }

    const bank = await this.bankRepository.findById(bankId);

    if (!bank) {
      throw new Error('Bank not found');
    }

    if ((bank as any).isActive === false) {
      throw new Error('Bank is inactive');
    }

    const updatedTransaction =
      await this.saleTransactionRepository.markPaidWithBank(
        transactionId,
        bankId,
        amountCollected,
      );

    if (!updatedTransaction) {
      throw new Error('Mark transaction paid failed');
    }

    return updatedTransaction;
  }
  async getInvoiceStatuses(
    idsText: string,
  ): Promise<SaleTransactionResponseDTO> {
    try {
      const ids = idsText
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (!ids?.length) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'ids query is required. Example: ?ids=id1,id2,id3',
        };
      }

      const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));

      if (invalidIds.length > 0) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Invalid transaction ids: ${invalidIds.join(', ')}`,
        };
      }

      const transactions =
        await this.saleTransactionRepository.findInvoiceStatusesByIds(ids);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Invoice statuses fetched successfully',
        content: transactions as any,
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting invoice statuses: ${error.message}`,
        'SaleTransactionService',
      );

      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error getting invoice statuses: ${error.message}`,
      };
    }
  }

  async updateSaleTransaction(
    id: string,
    updateData: UpdateTransactionDto,
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

  async updateTransactionBankAfterInvoice(
    transactionId: string,
    bankId: string,
    amountCollected: number | undefined,
    currentUser: { id: string; username: string; role: Role },
  ): Promise<SaleTransactionResponseDTO> {
    try {
      const beforeTransaction =
        await this.saleTransactionRepository.findById(transactionId);

      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });

      if (!beforeTransaction) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${transactionId} not found`,
        };
      }

      const updatedTransaction = await this.markSaleTransactionPaid(
        transactionId,
        bankId,
        amountCollected,
      );

      await this.auditLogService.log({
        actor: currentUser,
        action: AuditAction.MARK_TRANSACTION_PAID,
        resource: 'SaleTransaction',
        resourceId: transactionId,
        before: {
          bankId: (beforeTransaction as any).bankId,
          isPaid: (beforeTransaction as any).isPaid,
          amountCollected: (beforeTransaction as any).amountCollected,
          invoiceStatus: (beforeTransaction as any).invoiceStatus,
        },
        after: {
          bankId,
          isPaid: true,
          amountCollected,
          invoiceStatus: (beforeTransaction as any).invoiceStatus,
          paidDate: today,
        },
        metadata: {
          orderNumber: (beforeTransaction as any).orderNumber,
          inv_invoiceCreatedId: (beforeTransaction as any).inv_invoiceCreatedId,
          note: 'Payment information updated without changing invoice data',
        },
      });

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Transaction payment information updated successfully',
        content: updatedTransaction,
      };
    } catch (error: any) {
      this.logger.error(
        `Error updating transaction payment information: ${error.message}`,
      );

      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error updating transaction payment information: ${error.message}`,
      };
    }
  }

  async cancelSaleTransactionInvoice(
    id: string,
  ): Promise<SaleTransactionResponseDTO> {
    try {
      const transaction = await this.saleTransactionRepository.findById(id);

      if (!transaction) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
        };
      }

      const updatedTransaction =
        await this.saleTransactionRepository.markInvoiceCanceled(id);

      if (!updatedTransaction) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Sale transaction with ID ${id} not found`,
        };
      }

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Invoice canceled successfully',
        content: updatedTransaction,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while canceling invoice: ${error.message}`,
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

  async getSaleTransactionStats(): Promise<{
    code: number;
    info: string;
    message: string;
    content?: {
      totalTransactions: number;
      totalIssuedInvoices: number;
    };
  }> {
    try {
      const [totalTransactions, totalIssuedInvoices] = await Promise.all([
        this.saleTransactionRepository.countAll(),
        this.saleTransactionRepository.countIssuedInvoices(),
      ]);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Sale transaction statistics fetched successfully',
        content: {
          totalTransactions,
          totalIssuedInvoices,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error in SaleTransactionService.getSaleTransactionStats: ${error.message}`,
      );

      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `There is a problem while getting sale transaction statistics: ${error.message}`,
      };
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
}
