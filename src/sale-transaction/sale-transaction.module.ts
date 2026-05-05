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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesTransaction.name, schema: SalesTransactionSchema },
    ]),
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
