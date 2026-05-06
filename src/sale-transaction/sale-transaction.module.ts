import { Module } from '@nestjs/common';
import { SaleTransactionController } from '@transaction/sale-transaction.controller';
import { SaleTransactionService } from '@transaction/sale-transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionSchema,
} from '@schemas/sale-transaction.schema';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { AgencyModule } from '@agency/agency.module';
import { DepartmentModule } from '@department/department.module';
import { EmployeeModule } from '@employee/employee.module';
import { BankModule } from '@bank/bank.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesTransaction.name, schema: SalesTransactionSchema },
    ]),
    AgencyModule,
    DepartmentModule,
    EmployeeModule,
    BankModule,
  ],
  providers: [
    SaleTransactionService,
    SaleTransactionRepository,
    LoggerService,
    JwtAuthGuard,
  ],
  controllers: [SaleTransactionController],
  exports: [SaleTransactionService, SaleTransactionRepository, MongooseModule],
})
export class SaleTransactionModule {}
