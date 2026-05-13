import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BankRepository } from '@repositories/bank.repository';
import { Bank, BankDocument } from '@schemas/bank.schema';
import { Model } from 'mongoose';
import { CreateBankDto } from './dto/create-bank.req';
import { BankResponseDto } from './dto/bank.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { GetAllBanks } from './dto/get-all-bank.res';

@Injectable()
export class BankService {
  constructor(
    @InjectModel(Bank.name) private bankModel: Model<BankDocument>,
    private readonly bankRepository: BankRepository,
    private readonly logger: LoggerService,
  ) {}

  async createBank(createBankDto: CreateBankDto): Promise<BankResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { inv_buyerBankName } = createBankDto;
      // console.log(createBankDto);
      if (!inv_buyerBankName) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required field: name',
        };
        return response;
      }

      const duplicatedBank = await this.bankModel.findOne({
        inv_buyerBankName,
      });
      if (duplicatedBank) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Bank already exists',
        };
        return response;
      }

      const newBank = new this.bankModel({
        inv_buyerBankName,
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

  async getAllBanks(): Promise<GetAllBanks> {
    let response: GetAllBanks | null = null;
    try {
      const banks = await this.bankModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all banks successfully',
      };
      return response;
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async getBankById(id: string): Promise<BankResponseDto | null> {
    let response: BankResponseDto | null = null;
    try {
      const bank = await this.bankRepository.findById(id);

      if (!bank) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Bank with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Bank fetched successfully',
        content: bank,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async searchBanksByName(keyword: string, page = 1, limit = 10) {
    if (!keyword || !keyword.trim()) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const { data, total } = await this.bankRepository.searchByName(
      keyword.trim(),
      skip,
      currentLimit,
    );

    return {
      data: data.map((agency) => this.mapToResponseDto(agency)),
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
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
      message: `Bank ${deletedBank.inv_buyerBankName} deleted successfully`,
    };
  }

  private mapToResponseDto(bank: any): BankResponseDto {
    const response = new BankResponseDto();
    response.content = bank.toObject();
    return response;
  }
}
