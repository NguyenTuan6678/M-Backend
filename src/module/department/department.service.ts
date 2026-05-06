import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DepartmentRepository } from '@repositories/department.repository';
import { Department, DepartmentDocument } from '@schemas/department.schema';
import { Model } from 'mongoose';
import { CreateDepartmentDto } from './dto/create-department.req';
import { DepartmentResponseDto } from './dto/department.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';

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
      const { name } = createDepartmentDto;
      if (!name) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name',
        };
        return response;
      }

      const duplicatedDepartment = await this.departmentModel.findOne({ name });
      if (duplicatedDepartment) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Department already exists',
        };
        return response;
      }

      const newDepartment = new this.departmentModel({
        name,
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

  async getDepartmentById(id: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${id} dose not in database`,
      );
    }
    return this.mapToResponseDto(department);
  }

  async getAllDepartments(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<DepartmentResponseDto>> {
    const { data, total } = await this.departmentRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((department) => this.mapToResponseDto(department)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateDepartment(
    id: string,
    updateData: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentResponseDto> {
    const updatedDepartment = await this.departmentRepository.update(
      id,
      updateData,
    );
    if (!updatedDepartment) {
      throw new NotFoundException(
        `Department with ID ${id} does not in database`,
      );
    }
    return this.mapToResponseDto(updatedDepartment);
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
      message: `Department ${deletedDepartment.name} deleted successfully`,
    };
  }

  private mapToResponseDto(department: any): DepartmentResponseDto {
    const response = new DepartmentResponseDto();
    response.content = department.toObject();
    return response;
  }
}
