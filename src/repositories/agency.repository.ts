import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model, Types } from 'mongoose';
import { LoggerService } from '@common/logs/logger.service';
import { CreateAgencyDto } from '@module/agency/dto/create-agency.req';
import { UpdateAgencyDto } from '@module/agency/dto/update-agency.req';
import { Counter, CounterDocument } from '@schemas/counter.schema';

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
      { new: true, upsert: true },
    );
    return `AG${String(counter.seq).padStart(4, '0')}`;
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
      return await newAgency.save();
    } catch (error: any) {
      this.logger.error(`Error creating agency: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    skip = 0,
    limit = 10,
  ): Promise<{ data: AgencyDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.agencyModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.agencyModel.countDocuments().exec(),
      ]);

      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error finding agencies: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      return await this.agencyModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding agency by ID: ${error.message}`);
      throw error;
    }
  }

  async searchByName(
    keyword: string,
    skip = 0,
    limit = 10,
  ): Promise<{ data: AgencyDocument[]; total: number }> {
    try {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const filter = {
        name: {
          $regex: safeKeyword,
          $options: 'i',
        },
      };

      const [data, total] = await Promise.all([
        this.agencyModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.agencyModel.countDocuments(filter).exec(),
      ]);

      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error searching agency by name: ${error.message}`);
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

      return await this.agencyModel
        .findByIdAndUpdate(id, updateAgencyDto, {
          new: true,
          runValidators: true,
        })
        .exec();
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

      return await this.agencyModel.findByIdAndDelete(id).exec();
    } catch (error: any) {
      this.logger.error(`Error deleting agency: ${error.message}`);
      throw error;
    }
  }
}
