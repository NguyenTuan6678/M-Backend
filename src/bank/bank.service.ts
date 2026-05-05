import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BankRepository } from '@repositories/bank.repository';
import { Bank } from '@schemas/bank.schema';
import { Model } from 'mongoose';
import { CreateBankDto } from './dto/create-bank.req';
import { BankResponseDto } from './dto/bank.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';

@Injectable()
export class BankService {
  constructor(
    @InjectModel(Bank.name) private bankModel: Model<Bank>,
    private readonly bankRepository: BankRepository,
    private readonly logger: LoggerService,
  ) {}

  async createBank(createBankDto: CreateBankDto): Promise<BankResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { name, accountNumber, accountName } = createBankDto;
      if (!name || !accountNumber || !accountName) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message:
            'Missing required fields: name, accountNumber or accountName',
        };
        return response;
      }

      const duplicatedBank = await this.bankModel.findOne({ name });
      if (duplicatedBank) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Bank already exists',
        };
        return response;
      }

      const newBank = new this.bankModel({
        name,
        accountNumber,
        accountName,
      });

      await newBank.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Bank created successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: 'An error occurred while creating the bank',
      };
    }
    return response;
  }
}
