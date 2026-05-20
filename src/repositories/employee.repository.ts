import { LoggerService } from '@common/logs/logger.service';
import { CreateEmployeeDto } from '../module/employee/dto/create.employee.req';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Employee, EmployeeDocument } from '@schemas/employee.schema';
import { Model, Types } from 'mongoose';
import { Counter, CounterDocument } from '@schemas/counter.schema';
import { QueryEmployeeDto } from '@module/employee/dto/query-employee.req';

const POPULATE_OPTIONS = [
  {
    path: 'departmentId',
    select: 'departmentName departmentDescription departmentNumber',
  },
];

@Injectable()
export class EmployeeRepository {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private logger: LoggerService,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  private async generateEmployeeNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'employeeNumber' },
      { $inc: { seq: 1 } },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );
    return `EN${String(counter.seq).padStart(4, '0')}`;
  }

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeDocument> {
    try {
      const { employeeName, employeePhone, employeeEmail, departmentId } =
        createEmployeeDto;

      const employeeNumber = await this.generateEmployeeNumber();

      const dataSubmit = {
        ...createEmployeeDto,
        employeeNumber,
        employeeName,
        employeePhone,
        employeeEmail,
        ...(departmentId && { departmentId: new Types.ObjectId(departmentId) }),
      };

      const newEmployee = new this.employeeModel(dataSubmit);
      this.logger.log(
        `Employee created: ${newEmployee.employeeName}`,
        'BankRepository',
      );
      return await newEmployee.save();
    } catch (error: any) {
      this.logger.error(`Error creating employee: ${error.message}`, undefined);
      throw error;
    }
  }

  async findAll(): Promise<EmployeeDocument[]> {
    try {
      return await this.employeeModel
        .find()
        .populate(POPULATE_OPTIONS)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error fetching employees: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<EmployeeDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.error(`Invalid ObjectId: ${id}`, 'DepartmentRepository');
        return null;
      }

      return await this.employeeModel
        .findById(id)
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding sale transaction with employee: ${error.message}`,
        'SaleTransactionRepository',
      );
      throw error;
    }
  }

  async findAllWithFilters(query: QueryEmployeeDto): Promise<{
    data: EmployeeDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { departmentId, isActive, search } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (departmentId) {
        filter.departmentId = new Types.ObjectId(departmentId);
      }

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { employeeNumber: { $regex: safeSearch, $options: 'i' } },
          { employeeName: { $regex: safeSearch, $options: 'i' } },
          { employeeEmail: { $regex: safeSearch, $options: 'i' } },
          { employeePhone: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.employeeModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .populate(POPULATE_OPTIONS)
          .sort({ createdAt: -1 })
          .exec(),

        this.employeeModel.countDocuments(filter).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error(
        `Error finding employees with filters: ${error.message}`,
      );
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
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const updateEmployee = await this.employeeModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (updateEmployee) {
        this.logger.error(
          'Employee updated successfully',
          'EmployeeRepository',
        );
      }
      return updateEmployee;
    } catch (error: any) {
      this.logger.error(`Error updating employee: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<EmployeeDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

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
