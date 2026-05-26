import { Injectable } from '@nestjs/common';
import { AgencyRepository } from '@repositories/agency.repository';
import { CreateAgencyDto } from './dto/create-agency.req';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { AgencyResponseDto } from './dto/agency.res';
import { InjectModel } from '@nestjs/mongoose';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model } from 'mongoose';
import { QueryAgencyDto } from './dto/query-agency.req';
import { EmployeeRepository } from '@repositories/employee.repository';

@Injectable()
export class AgencyService {
  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private readonly agencyRepository: AgencyRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async createAgency(
    createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto | null> {
    let response: MessageResponse | null = null;
    try {
      const { agencyName, commissionPercent } = createAgencyDto;

      if (!agencyName) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: agencyName',
        };
      }

      const duplicatedAgency = await this.agencyModel.findOne({ agencyName });
      if (duplicatedAgency) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Agency already exists',
        };
        return response;
      }

      const newAgency = await this.agencyRepository.create(createAgencyDto);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency created successfully',
        content: newAgency,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error creating agency: ${error.message}`,
      };
    }
  }

  async searchAgencies(query: QueryAgencyDto) {
    try {
      const result = await this.agencyRepository.findAllWithFilters(query);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Agencies fetched successfully',
        ...result,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error searching agencies: ${error.message}`,
      };
    }
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
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency fetched successfully',
        content: agency,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting agency by id: ${error.message}`,
      };
    }
    return response;
  }

  async updateAgency(
    id: string,
    updateData: Partial<CreateAgencyDto>,
  ): Promise<AgencyResponseDto | null> {
    try {
      if (updateData.employeeId) {
        const employee = await this.employeeRepository.findActiveById(
          updateData.employeeId,
        );

        if (!employee) {
          return {
            code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,

            info: ERROR_INFO.FAIL,

            message:
              'Employee not found or inactive. Cannot assign inactive employee to agency.',

            content: undefined,
          };
        }
      }

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
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency updated successfully',
        content: updatedAgency,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while updating agency: ${error.message}`,
        content: undefined,
      };
    }
  }

  async deleteAgency(id: string): Promise<MessageResponse> {
    const deletedAgency = await this.agencyRepository.delete(id);
    if (!deletedAgency) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Agency with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
      message: 'Agency deleted successfully',
    };
  }
}
