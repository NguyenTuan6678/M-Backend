import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@repositories/users.repository';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import { plainToClass } from 'class-transformer';
import { LoggerService } from '@common/logs/logger.service';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@schemas/users.schema';
import { Model } from 'mongoose';
import { ERROR_RES } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';
import { Role } from '@utils/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async createUser(createUserDto: CreateUsersDTO): Promise<UsersResponseDTO> {
    let response: MessageResponse | null = null;
    try {
      const { username, password, role } = createUserDto;
      if (!username || !password || !role) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: username, password, or role',
        };
        return response;
      }

      if (role === Role.ADMIN) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'You cannot create admin user',
        };
        return response;
      }

      const duplicateUser = await this.userModel.findOne({ username });
      if (duplicateUser) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Username already exists',
        };
        return response;
      }

      const newUser = new this.userModel({
        username,
        password,
        role,
      });

      await newUser.save();

      response = {
        code: 200,
        info: 'SUCCESS',
        message: 'User created successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: 'An error occurred while creating the user',
      };
    }

    return response;
  }

  async getUserById(id: string): Promise<UsersResponseDTO> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not in database`);
    }
    return this.mapToResponseDto(user);
  }

  async getAllUsers(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UsersResponseDTO>> {
    const { data, total } = await this.userRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((user) => this.mapToResponseDto(user)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateUser(
    id: string,
    updateData: Partial<CreateUsersDTO>,
  ): Promise<UsersResponseDTO> {
    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} does not in database`);
    }
    return this.mapToResponseDto(updatedUser);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} does not in database`);
    }
    this.logger.log(`User deleted: ${deletedUser.username}`, 'UsersService');
    return { message: `User ${deletedUser.username} deleted` };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UsersResponseDTO | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }
    return this.mapToResponseDto(user);
  }

  async getUserStats(): Promise<{ totalUsers: number }> {
    const total = await this.userRepository.countAll();
    return { totalUsers: total };
  }

  private mapToResponseDto(user: any): UsersResponseDTO {
    return plainToClass(UsersResponseDTO, user.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
