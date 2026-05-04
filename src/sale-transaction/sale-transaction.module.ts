import { Module } from '@nestjs/common';
import { SaleTransactionController } from './controllers/sale-transaction.controller';
import { SaleTransactionService } from './services/sale-transaction.service';

@Module({
  providers: [SaleTransactionService],
  controllers: [SaleTransactionController],
})
export class SaleTransactionModule {}
