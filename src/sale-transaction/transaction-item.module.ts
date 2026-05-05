import { Module } from '@nestjs/common';
import { Mongoose } from 'mongoose';
import {
  TransactionItem,
  TransactionItemSchema,
} from './schemas/transaction-item.schema';
import { TransactionItemController } from './controllers/transaction-item.controller';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { TransactionItemService } from './services/transaction-item.service';
import { TransactionItemRepository } from './repositories/transaction-item.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionItem.name, schema: TransactionItemSchema },
    ]),
  ],
  controllers: [TransactionItemController],
  providers: [
    TransactionItemService,
    TransactionItemRepository,
    LoggerService,
    JwtAuthGuard,
  ],
})
export class TransactionItemModule {}
