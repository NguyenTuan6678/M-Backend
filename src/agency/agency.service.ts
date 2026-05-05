import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AgencyRepository } from '@repositories/agency.repository';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model } from 'mongoose';
import { CreateAgencyDto } from '@agency/dto/create-agency.req';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';
import { AgencyResponseDto } from '@agency/dto/agency.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';

@Injectable()
export class AgencyService {
  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private readonly agencyRepository: AgencyRepository,
    private readonly logger: LoggerService,
  ) {}

  async createAgency(
    createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    let response: MessageResponse | null = null;
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

  async getAllAgencies(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<AgencyResponseDto>> {
    const { data, total } = await this.agencyRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((agency) => this.mapToResponseDto(agency)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  private mapToResponseDto(agency: any): AgencyResponseDto {
    const response = new AgencyResponseDto();
    response.content = agency.toObject();
    return response;
  }
}
