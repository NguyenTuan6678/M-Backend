import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeRepository } from '@repositories/employee.repository';
import { Employee, EmployeeDocument } from '@schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create.employee.req';
import { EmployeeResponseDto } from './dto/employee.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetAllEmployees } from './dto/get-all-employee.res';

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
      const { employeeName, employeeEmail, employeePhone } = createEmployeeDto;
      if (!employeeName) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name',
        };
        return response;
      }

      const duplicatedEmployee = await this.employeeModel.findOne({
        employeeName,
      });
      if (duplicatedEmployee) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Employee already exists',
        };
        return response;
      }

      const newEmployee = new this.employeeModel({
        employeeName,
        employeeEmail,
        employeePhone,
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

  async getAllEmployees(): Promise<GetAllEmployees> {
    let response: GetAllEmployees | null = null;
    try {
      const employees = await this.employeeModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all agencies successfully',
        content: employees,
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

  async getEmployeeById(id: string): Promise<EmployeeResponseDto | null> {
    let response: EmployeeResponseDto | null = null;
    try {
      const employee = await this.employeeRepository.findById(id);

      if (!employee) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Employee with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency fetched successfully',
        content: employee,
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

  async searchEmployeesByName(keyword: string, page = 1, limit = 10) {
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

    const { data, total } = await this.employeeRepository.searchByName(
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

  async updateEmployee(
    id: string,
    updateData: Partial<CreateEmployeeDto>,
  ): Promise<EmployeeResponseDto> {
    try {
      const updatedEmployee = await this.employeeRepository.update(
        id,
        updateData,
      );

      if (!updatedEmployee) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Employee with ID ${id} not found`,
          content: updatedEmployee || undefined,
        };
      }

      return {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Employee updated successfully',
        content: updatedEmployee,
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
      message: `Employee ${deletedEmployee.employeeName} deleted successfully`,
    };
  }

  private mapToResponseDto(employee: any): EmployeeResponseDto {
    const response = new EmployeeResponseDto();
    response.content = employee.toObject();
    return response;
  }
}
