import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BankRepository } from '@repositories/bank.repository';
import { Bank } from '@schemas/bank.schema';
import { Model } from 'mongoose';
import { CreateBankDto } from './dto/create-bank.req';
import { BankResponseDto } from './dto/bank.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';

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

  async getBankById(id: string): Promise<BankResponseDto> {
    const bank = await this.bankRepository.findById(id);
    if (!bank) {
      throw new NotFoundException(`Bank with ID ${id} dose not in database`);
    }
    return this.mapToResponseDto(bank);
  }

  private mapToResponseDto(user: any): BankResponseDto {
    const response = new BankResponseDto();
    response.content = user.toObject();
    return response;
  }

  async getAllBanks(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<BankResponseDto>> {
    const { data, total } = await this.bankRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((bank) => this.mapToResponseDto(bank)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateBank(
    id: string,
    updateData: Partial<CreateBankDto>,
  ): Promise<BankResponseDto> {
    const updatedBank = await this.bankRepository.update(id, updateData);
    if (!updatedBank) {
      throw new NotFoundException(`Bank with ID ${id} does not in database`);
    }
    return this.mapToResponseDto(updatedBank);
  }

  async deleteBank(id: string): Promise<MessageResponse> {
    const deletedBank = await this.bankRepository.delete(id);
    if (!deletedBank) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Bank with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: `Bank ${deletedBank.name} deleted successfully`,
    };
  }
}
