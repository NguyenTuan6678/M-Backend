import { Module } from '@nestjs/common';
import { SaleTransactionController } from '@module/sale-transaction/sale-transaction.controller';
import { SaleTransactionService } from '@module/sale-transaction/sale-transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SalesTransaction,
  SalesTransactionSchema,
} from '@schemas/sale-transaction.schema';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { SaleTransactionRepository } from '@repositories/sale-transaction.repository';
import { AgencyModule } from '../agency/agency.module';
import { DepartmentModule } from '../department/department.module';
import { EmployeeModule } from '../employee/employee.module';
import { BankModule } from '../bank/bank.module';
import { ProductModule } from '../product/product.module';
import { Agency, AgencySchema } from '@schemas/agency.schema';
import { Department, DepartmentSchema } from '@schemas/department.schema';
import { Employee, EmployeeSchema } from '@schemas/employee.schema';
import { Bank, BankSchema } from '@schemas/bank.schema';
import { Product, ProductSchema } from '@schemas/product.schema';
import { Counter, CounterSchema } from '@schemas/counter.schema';
import { AlertModule } from '@common/alerts/alert.module';
import { InvoiceMonitorService } from '@common/invoice-monitor/invoice-monitor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesTransaction.name, schema: SalesTransactionSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Bank.name, schema: BankSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    AgencyModule,
    DepartmentModule,
    EmployeeModule,
    BankModule,
    ProductModule,
    AlertModule,
  ],
  providers: [
    SaleTransactionService,
    SaleTransactionRepository,
    InvoiceMonitorService,
    LoggerService,
    JwtAuthGuard,
  ],
  controllers: [SaleTransactionController],
  exports: [SaleTransactionService, SaleTransactionRepository, MongooseModule],
})
export class SaleTransactionModule {}
