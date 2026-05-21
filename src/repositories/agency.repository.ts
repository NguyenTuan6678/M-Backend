import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model, Types } from 'mongoose';
import { LoggerService } from '@common/logs/logger.service';
import { CreateAgencyDto } from '@module/agency/dto/create-agency.req';
import { UpdateAgencyDto } from '@module/agency/dto/update-agency.req';
import { Counter, CounterDocument } from '@schemas/counter.schema';
import { QueryAgencyDto } from '@module/agency/dto/query-agency.req';

const POPULATE_OPTIONS = [
  {
    path: 'employeeId',
    select: 'employeeName employeeEmail employeePhone departmentId',
    populate: {
      path: 'departmentId',
      select: 'departmentName departmentDescription',
    },
  },
];

@Injectable()
export class AgencyRepository {
  constructor(
    @InjectModel(Agency.name)
    private readonly agencyModel: Model<AgencyDocument>,
    private readonly logger: LoggerService,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  private async generateAgencyNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'agencyNumber' },
      { $inc: { seq: 1 } },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );
    return `DL${String(counter.seq).padStart(4, '0')}`;
  }

  async create(createAgencyDto: CreateAgencyDto): Promise<AgencyDocument> {
    try {
      const { agencyEmail, employeeId } = createAgencyDto;

      const agencyNumber = await this.generateAgencyNumber();

      const dataSubmit = {
        ...createAgencyDto,
        agencyNumber,
        agencyEmail,
        ...(employeeId && { employeeId: new Types.ObjectId(employeeId) }),
      };
      const newAgency = new this.agencyModel(dataSubmit);
      this.logger.log(
        `Agency created: ${newAgency.agencyName}`,
        `AgencyRepository`,
      );
      return await newAgency.save();
    } catch (error: any) {
      this.logger.error(`Error creating agency: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      return await this.agencyModel
        .findById(id)
        .populate(POPULATE_OPTIONS)
        .exec();
    } catch (error: any) {
      this.logger.error(`Error finding agency by ID: ${error.message}`);
      throw error;
    }
  }

  async findAllWithFilters(query: QueryAgencyDto): Promise<{
    data: AgencyDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { employeeId, isActive, search } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (employeeId) {
        filter.employeeId = new Types.ObjectId(employeeId);
      }

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { agencyNumber: { $regex: safeSearch, $options: 'i' } },
          { agencyName: { $regex: safeSearch, $options: 'i' } },
          { agencyEmail: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.agencyModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .populate(POPULATE_OPTIONS)
          .sort({ createdAt: -1 })
          .exec(),

        this.agencyModel.countDocuments(filter).exec(),
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
        `Error finding agencies with filters: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateAgencyDto: UpdateAgencyDto,
  ): Promise<AgencyDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const updateAgency = await this.agencyModel
        .findByIdAndUpdate(id, updateAgencyDto, {
          new: true,
          runValidators: true,
        })
        .exec();
      if (updateAgency) {
        this.logger.error('Agency updated successfully', 'AgencyRepository');
      }
      return updateAgency;
    } catch (error: any) {
      this.logger.error(`Error updating agency: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<AgencyDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const deleteAgency = await this.agencyModel.findByIdAndDelete(id).exec();
      if (deleteAgency) {
        this.logger.log(
          `Agency deleted: ${deleteAgency.agencyName}`,
          'AgencyRepository',
        );
      }
      return deleteAgency;
    } catch (error: any) {
      this.logger.error(`Error deleting agency: ${error.message}`);
      throw error;
    }
  }
}
