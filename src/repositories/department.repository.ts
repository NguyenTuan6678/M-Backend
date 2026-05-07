import { LoggerService } from '@common/logs/logger.service';
import { CreateDepartmentDto } from '../module/department/dto/create-department.req';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Department, DepartmentDocument } from '@schemas/department.schema';
import { Model } from 'mongoose';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<Department>,
    private logger: LoggerService,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDocument> {
    try {
      const newDepartment = new this.departmentModel(createDepartmentDto);
      const savedDepartment = await newDepartment.save();
      this.logger.log(
        `Department created: ${savedDepartment.departmentName}`,
        `DepartmentRepository`,
      );
      return savedDepartment;
    } catch (error: any) {
      this.logger.error(
        `Error creating department: ${error.message}`,
        undefined,
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

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: DepartmentDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.departmentModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.departmentModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error fetching departments: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentDocument | null> {
    try {
      return await this.departmentModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
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
