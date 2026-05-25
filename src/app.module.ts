import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '@users/users.module';
import { AuthModule } from '@users/auth/auth.module';
import configuration from '@config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaleTransactionModule } from '@module/sale-transaction/sale-transaction.module';
import { AgencyModule } from './module/agency/agency.module';
import { BankModule } from './module/bank/bank.module';
import { DepartmentModule } from './module/department/department.module';
import { EmployeeModule } from './module/employee/employee.module';
import { ProductModule } from './module/product/product.module';
import { MInvoiceReceiptGetModule } from './api/m-invoice-receipt-get/m-invoice-receipt-get.module';
import { MInvoiceReceiptPostModule } from './api/m-invoice-receipt-post/m-invoice-receipt-post.module';
import { ReceiptInvoiceModule } from '@module/receiptinvoice/receiptinvoice.module';
import { ViewMInvoiceReceiptModule } from './api/m-invoice-receipt-get-view/m-invoice-receipt-get-view.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { ShutdownService } from './common/shutdown/shutdown.service';
import { RequestLoggingInterceptor } from '@common/request-logging/request-logging.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertModule } from '@common/alerts/alert.module';
import { SaleTransactionImportController } from './module/sale-transaction/import/sale-transaction-import.controller';
import { SaleTransactionImportService } from './module/sale-transaction/import/sale-transaction-import.service';
import { InvoiceQueueModule } from './api/queues/invoice-queue.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    CacheModule.register({ ttl: 5000, isGlobal: true }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongodb.uri'),
        dbName: configService.get<string>('app.mongodb.name'),
        retryAttempts: 5,
        retryDelay: 1000,
      }),
    }),

    UsersModule,
    SaleTransactionModule,
    AgencyModule,
    BankModule,
    DepartmentModule,
    EmployeeModule,
    ProductModule,
    AuthModule,
    ReceiptInvoiceModule,
    MInvoiceReceiptGetModule,
    MInvoiceReceiptPostModule,
    ViewMInvoiceReceiptModule,
    HealthModule,
    AlertModule,
    InvoiceQueueModule,
  ],
  controllers: [AppController, SaleTransactionImportController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    ShutdownService,
    SaleTransactionImportService,
  ],
})
export class AppModule {}
