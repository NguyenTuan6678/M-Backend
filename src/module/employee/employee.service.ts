import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '@repositories/employee.repository';
import { Employee, EmployeeDocument } from '@schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create.employee.req';
import { UpdateEmployeeDto } from './dto/update.employee.req';
import { EmployeeResponseDto } from './dto/employee.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryEmployeeDto } from './dto/query-employee.req';
import { DepartmentRepository } from '@repositories/department.repository';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private readonly employeeRepository: EmployeeRepository,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { employeeName, employeeEmail, employeePhone, departmentId } =
        createEmployeeDto;
      if (!employeeName || !departmentId) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: employeeName or departmentId',
        };
        return response;
      }

      if (createEmployeeDto.departmentId) {
        const department = await this.departmentRepository.findActiveById(
          createEmployeeDto.departmentId,
        );

        if (!department) {
          return {
            code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
            info: ERROR_INFO.FAIL,
            message:
              'Department not found or inactive. Cannot assign inactive department to employee.',
            content: undefined,
          };
        }
      }

      const duplicatedEmployee = await this.employeeModel.findOne({
        employeeName,
      });
      if (duplicatedEmployee) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Employee already exists',
        };
        return response;
      }

      const newEmployee =
        await this.employeeRepository.create(createEmployeeDto);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Employee created successfully',
        content: newEmployee,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'An error occurred while creating the employee',
      };
    }
    return response;
  }

  async searchEmployees(query: QueryEmployeeDto) {
    try {
      const result = await this.employeeRepository.findAllWithFilters(query);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Employees fetched successfully',
        ...result,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error searching employees: ${error.message}`,
      };
    }
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
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Employee fetched successfully',
        content: employee,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting emplyoyee by id: ${error.message}`,
      };
    }
    return response;
  }

  async updateEmployee(
    id: string,
    updateData: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    try {
      if (updateData.departmentId) {
        const department = await this.departmentRepository.findActiveById(
          updateData.departmentId,
        );

        if (!department) {
          return {
            code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,

            info: ERROR_INFO.FAIL,

            message:
              'Department not found or inactive. Cannot assign inactive deparment to employee.',

            content: undefined,
          };
        }
      }

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
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Employee updated successfully',
        content: updatedEmployee,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while creating the employee: ${error.message}`,
        content: undefined,
      };
    }
  }

  async deleteEmployee(id: string): Promise<MessageResponse> {
    const deletedEmployee = await this.employeeRepository.delete(id);
    if (!deletedEmployee) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Employee with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
      message: `Employee ${deletedEmployee.employeeName} deleted successfully`,
    };
  }
}
