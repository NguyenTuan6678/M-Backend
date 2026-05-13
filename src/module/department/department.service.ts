import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DepartmentRepository } from '@repositories/department.repository';
import { Department, DepartmentDocument } from '@schemas/department.schema';
import { Model } from 'mongoose';
import { CreateDepartmentDto } from './dto/create-department.req';
import { DepartmentResponseDto } from './dto/department.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { GetAllDepartments } from './dto/get-all-department.res';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    private readonly departmentRepository: DepartmentRepository,
    private readonly logger: LoggerService,
  ) {}

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { departmentName, departmentDescription } = createDepartmentDto;
      if (!departmentName) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name',
        };
        return response;
      }

      const duplicatedDepartment = await this.departmentModel.findOne({
        departmentName,
      });
      if (duplicatedDepartment) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Department already exists',
        };
        return response;
      }

      const newDepartment = new this.departmentModel({
        departmentName,
        departmentDescription,
      });

      await newDepartment.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Department created successfully',
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

  async getAllDepartments(): Promise<GetAllDepartments> {
    let response: GetAllDepartments | null = null;
    try {
      const departments = await this.departmentModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all agencies successfully',
        content: departments,
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

  async getDepartmentById(id: string): Promise<DepartmentResponseDto | null> {
    let response: DepartmentResponseDto | null = null;
    try {
      const department = await this.departmentRepository.findById(id);

      if (!department) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Department with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Department fetched successfully',
        content: department,
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

  async searchDepartmentsByName(keyword: string, page = 1, limit = 10) {
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

    const { data, total } = await this.departmentRepository.searchByName(
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

  async updateDepartment(
    id: string,
    updateData: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentResponseDto> {
    try {
      const updatedDepartment = await this.departmentRepository.update(
        id,
        updateData,
      );

      if (!updatedDepartment) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Agency with ID ${id} not found`,
          content: updatedDepartment || undefined,
        };
      }

      return {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency updated successfully',
        content: updatedDepartment,
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

  async deleteDepartment(id: string): Promise<MessageResponse> {
    const deletedDepartment = await this.departmentRepository.delete(id);
    if (!deletedDepartment) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Department with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: `Department ${deletedDepartment.departmentName} deleted successfully`,
    };
  }

  private mapToResponseDto(department: any): DepartmentResponseDto {
    const response = new DepartmentResponseDto();
    response.content = department.toObject();
    return response;
  }
}
