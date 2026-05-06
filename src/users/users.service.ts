import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@repositories/users.repository';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import { LoggerService } from '@common/logs/logger.service';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@schemas/users.schema';
import { Model } from 'mongoose';
import { ERROR_RES, ERROR_INFO } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';
import { Role } from '@utils/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async createUser(
    createUserDto: CreateUsersDTO,
    currentUser: { id: string; username: string; role: Role },
  ): Promise<UsersResponseDTO> {
    let response: MessageResponse | null = null;
    try {
      if (currentUser.role !== Role.ADMIN) {
        response = {
          code: ERROR_RES.FORBIDDEN_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Only ADMIN can create user accounts',
        };
        return response;
      }

      const { username, password, role } = createUserDto;
      if (!username || !password) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: username or password',
        };
        return response;
      }

      const userRole = role ?? Role.USER;
      if (userRole === Role.ADMIN) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
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
        role: userRole,
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

  async deleteUser(id: string): Promise<MessageResponse> {
    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `User with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: `User ${deletedUser.username} deleted successfully`,
    };
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
    const response = new UsersResponseDTO();
    response.content = user.toObject();
    return response;
  }
}
