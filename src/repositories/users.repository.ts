import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@schemas/users.schema';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { LoggerService } from '@common/logs/logger.service';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUsersDTO): Promise<UserDocument> {
    try {
      const newUser = new this.userModel(createUserDto);
      const savedUser = await newUser.save();
      this.logger.log(`User created: ${savedUser.username}`, 'UserRepository');
      return savedUser;
    } catch (error: any) {
      this.logger.error(`Error creating user: ${error.message}`, undefined);
      throw error;
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding user by ID: ${error.message}`);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ username }).exec();
    } catch (error: any) {
      this.logger.error(`Error finding user by username: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: UserDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.userModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.userModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateData: Partial<CreateUsersDTO>,
  ): Promise<UserDocument | null> {
    try {
      return await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findByIdAndDelete(id).exec();
    } catch (error: any) {
      this.logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.userModel.countDocuments().exec();
    } catch (error: any) {
      this.logger.error(`Error counting users: ${error.message}`);
      throw error;
    }
  }
}
