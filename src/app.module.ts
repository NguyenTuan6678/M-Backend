import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
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

@Module({
  imports: [
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
    MInvoiceReceiptGetModule,
    MInvoiceReceiptPostModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
