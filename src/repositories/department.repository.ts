import { LoggerService } from '@common/logs/logger.service';
import { CreateDepartmentDto } from '../module/department/dto/create-department.req';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Department, DepartmentDocument } from '@schemas/department.schema';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '@schemas/counter.schema';
import { QueryDepartmentDto } from '@module/department/dto/query-department.req';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<Department>,
    private logger: LoggerService,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  private async generateDepartmentNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'departmentNumber' },
      { $inc: { seq: 1 } },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );
    return `PB${String(counter.seq).padStart(4, '0')}`;
  }

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDocument> {
    try {
      const { departmentName, departmentDescription } = createDepartmentDto;

      const departmentNumber = await this.generateDepartmentNumber();

      const dataSubmit = {
        ...createDepartmentDto,
        departmentNumber,
        departmentName,
        departmentDescription,
      };

      const savedDepartment = new this.departmentModel(dataSubmit);
      this.logger.log(
        `Department created: ${savedDepartment.departmentName}`,
        `DepartmentRepository`,
      );
      return await savedDepartment.save();
    } catch (error: any) {
      this.logger.error(`Error creating department: ${error.message}`);
      throw error;
    }
  }

  async findAllWithFilters(query: QueryDepartmentDto): Promise<{
    data: DepartmentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { isActive, search } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { departmentNumber: { $regex: safeSearch, $options: 'i' } },
          { departmentName: { $regex: safeSearch, $options: 'i' } },
          { departmentDescription: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.departmentModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.departmentModel.countDocuments(filter).exec(),
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
        `Error finding departments with filters: ${error.message}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<DepartmentDocument | null> {
    try {
      return await this.departmentModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding department by ID: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentDocument | null> {
    try {
      const updateDepartment = await this.departmentModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (updateDepartment) {
        this.logger.error(
          'Department updated successfully',
          'DepartmentRepository',
        );
      }
      return updateDepartment;
    } catch (error: any) {
      this.logger.error(`Error updating department: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<DepartmentDocument | null> {
    try {
      const deletedBank = await this.departmentModel
        .findByIdAndDelete(id)
        .exec();
      if (deletedBank) {
        this.logger.log(
          `Department deleted: ${deletedBank.departmentName}`,
          'DepartmentRepository',
        );
      }
      return deletedBank;
    } catch (error: any) {
      this.logger.error(`Error deleting department: ${error.message}`);
      throw error;
    }
  }
}
