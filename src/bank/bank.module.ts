import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bank, BankSchema } from '@schemas/bank.schema';
import { BankController } from '@bank/bank.controller';
import { BankService } from '@bank/bank.service';
import { BankRepository } from '@repositories/bank.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bank.name, schema: BankSchema }]),
  ],
  controllers: [BankController],
  providers: [BankService, BankRepository, LoggerService, JwtAuthGuard],
  exports: [BankService, BankRepository, MongooseModule],
})
export class BankModule {}
