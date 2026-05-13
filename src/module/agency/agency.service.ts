import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AgencyRepository } from '@repositories/agency.repository';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model } from 'mongoose';
import { CreateAgencyDto } from './dto/create-agency.req';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { AgencyResponseDto } from './dto/agency.res';
import { GetAllAgencies } from './dto/get-all-agency.res';

@Injectable()
export class AgencyService {
  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private readonly agencyRepository: AgencyRepository,
    private readonly logger: LoggerService,
  ) {}

  async createAgency(
    createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto | null> {
    let response: AgencyResponseDto | null = null;
    try {
      const { name, commissionPercent } = createAgencyDto;
      if (!name || !commissionPercent) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name or commissionPercent',
        };
        return response;
      }

      const newAgency = new this.agencyModel({
        name,
        commissionPercent,
      });

      await newAgency.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Agency created successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: `Error creating agency: ${error.message}`,
      };
    }
    return response;
  }

  async getAllAgencies(): Promise<GetAllAgencies> {
    let response: GetAllAgencies | null = null;
    try {
      const agencies = await this.agencyModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all agencies successfully',
        content: agencies,
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

  async getAgencyById(id: string): Promise<AgencyResponseDto | null> {
    let response: AgencyResponseDto | null = null;
    try {
      const agency = await this.agencyRepository.findById(id);

      if (!agency) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Agency with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency fetched successfully',
        content: agency,
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

  async searchAgenciesByName(keyword: string, page = 1, limit = 10) {
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

    const { data, total } = await this.agencyRepository.searchByName(
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

  async updateAgency(
    id: string,
    updateData: Partial<CreateAgencyDto>,
  ): Promise<AgencyResponseDto | null> {
    try {
      const updatedAgency = await this.agencyRepository.update(id, updateData);

      if (!updatedAgency) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Agency with ID ${id} not found`,
          content: updatedAgency || undefined,
        };
      }

      return {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency updated successfully',
        content: updatedAgency,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: undefined,
      };
    }
  }

  async deleteAgency(id: string): Promise<MessageResponse> {
    const deletedAgency = await this.agencyRepository.delete(id);
    if (!deletedAgency) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Agency with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: 'Agency deleted successfully',
    };
  }

  private mapToResponseDto(agency: any): AgencyResponseDto {
    const response = new AgencyResponseDto();
    response.content = agency.toObject();
    return response;
  }
}
