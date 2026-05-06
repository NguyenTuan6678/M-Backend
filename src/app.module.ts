import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
