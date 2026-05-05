import { CreateAgencyDto } from '@agency/dto/create-agency.req';
import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agency, AgencyDocument } from '@schemas/agency.schema';
import { Model } from 'mongoose';

@Injectable()
export class AgencyRepository {
  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private logger: LoggerService,
  ) {}

  async create(createAgencyDto: CreateAgencyDto): Promise<AgencyDocument> {
    try {
      const newAgency = new this.agencyModel(createAgencyDto);
      const savedAgency = await newAgency.save();
      this.logger.log(
        `Agency created: ${savedAgency.name}`,
        'AgencyRepository',
      );
      return savedAgency;
    } catch (error: any) {
      this.logger.error(`Error creating agency: ${error.message}`, undefined);
      throw error;
    }
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    try {
      return await this.agencyModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding agency by ID: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    skip: number = 0,
    limit: number = 10,
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
      this.logger.error(`Error finding all agencies: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateAgencyDto>,
  ): Promise<AgencyDocument | null> {
    try {
      const updatedAgency = await this.agencyModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (updatedAgency) {
        this.logger.log(
          `Agency updated: ${updatedAgency.name}`,
          'AgencyRepository',
        );
      }
      return updatedAgency;
    } catch (error: any) {
      this.logger.error(`Error updating agency: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<AgencyDocument | null> {
    try {
      const deletedAgency = await this.agencyModel.findByIdAndDelete(id).exec();
      if (deletedAgency) {
        this.logger.log(
          `Agency deleted: ${deletedAgency.name}`,
          'AgencyRepository',
        );
      }
      return deletedAgency;
    } catch (error: any) {
      this.logger.error(`Error deleting agency: ${error.message}`);
      throw error;
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.agencyModel.countDocuments().exec();
    } catch (error: any) {
      this.logger.error(`Error counting agencies: ${error.message}`);
      throw error;
    }
  }
}
