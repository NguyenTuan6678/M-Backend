import { LoggerService } from '@common/logs/logger.service';
import { CreateEmployeeDto } from '../module/employee/dto/create.employee.req';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Employee, EmployeeDocument } from '@schemas/employee.schema';
import { Model } from 'mongoose';

@Injectable()
export class EmployeeRepository {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private logger: LoggerService,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeDocument> {
    try {
      const newEmployee = new this.employeeModel(createEmployeeDto);
      const savedEmployee = await newEmployee.save();
      this.logger.log(
        `Employee created: ${savedEmployee.employeeName}`,
        'BankRepository',
      );
      return savedEmployee;
    } catch (error: any) {
      this.logger.error(`Error creating employee: ${error.message}`, undefined);
      throw error;
    }
  }

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: EmployeeDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.employeeModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.employeeModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error fetching employees: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<EmployeeDocument | null> {
    try {
      return await this.employeeModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding employee by ID: ${error.message}`);
      throw error;
    }
  }

  async searchByName(
    keyword: string,
    skip = 0,
    limit = 10,
  ): Promise<{ data: EmployeeDocument[]; total: number }> {
    try {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const filter = {
        employeeName: {
          $regex: safeKeyword,
          $options: 'i',
        },
      };

      const [data, total] = await Promise.all([
        this.employeeModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.employeeModel.countDocuments(filter).exec(),
      ]);

      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error searching employee by name: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateEmployeeDto>,
  ): Promise<EmployeeDocument | null> {
    try {
      return await this.employeeModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error updating employee: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<EmployeeDocument | null> {
    try {
      const deletedEmployee = await this.employeeModel
        .findByIdAndDelete(id)
        .exec();
      if (deletedEmployee) {
        this.logger.log(
          `Employee deleted: ${deletedEmployee.employeeName}`,
          'EmployeeRepository',
        );
      }
      return deletedEmployee;
    } catch (error: any) {
      this.logger.error(`Error deleting employee: ${error.message}`);
      throw error;
    }
  }
}
