import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeRepository } from '@repositories/employee.repository';
import { Employee, EmployeeDocument } from '@schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create.employee.req';
import { EmployeeResponseDto } from './dto/employee.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private readonly employeeRepository: EmployeeRepository,
    private readonly logger: LoggerService,
  ) {}

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { name, email, phone } = createEmployeeDto;
      if (!name) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name',
        };
        return response;
      }

      const duplicatedEmployee = await this.employeeModel.findOne({ name });
      if (duplicatedEmployee) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Employee already exists',
        };
        return response;
      }

      const newEmployee = new this.employeeModel({
        name,
        email,
        phone,
      });

      await newEmployee.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Employee created successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: 'An error occurred while creating the employee',
      };
    }
    return response;
  }

  async getEmployeeById(id: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${id} dose not in database`,
      );
    }
    return this.mapToResponseDto(employee);
  }

  async getAllEmployees(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<EmployeeResponseDto>> {
    const { data, total } = await this.employeeRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((employee) => this.mapToResponseDto(employee)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateEmployee(
    id: string,
    updateData: Partial<CreateEmployeeDto>,
  ): Promise<EmployeeResponseDto> {
    const updatedEmployee = await this.employeeRepository.update(
      id,
      updateData,
    );
    if (!updatedEmployee) {
      throw new NotFoundException(
        `Employee with ID ${id} does not in database`,
      );
    }
    return this.mapToResponseDto(updatedEmployee);
  }

  async deleteEmployee(id: string): Promise<MessageResponse> {
    const deletedEmployee = await this.employeeRepository.delete(id);
    if (!deletedEmployee) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Employee with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: `Employee ${deletedEmployee.name} deleted successfully`,
    };
  }

  private mapToResponseDto(employee: any): EmployeeResponseDto {
    const response = new EmployeeResponseDto();
    response.content = employee.toObject();
    return response;
  }
}
