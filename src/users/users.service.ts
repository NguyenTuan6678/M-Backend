import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@repositories/users.repository';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@schemas/users.schema';
import { Model } from 'mongoose';
import { ERROR_RES, ERROR_INFO } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';
import { Role } from '@utils/role.enum';
import { GetAllUsers } from './dto/get-all-users.res';
import { QueryUserDto } from './dto/query-user.req';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userRepository: UsersRepository,
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
          info: ERROR_INFO.FAIL,
          message: 'Username already exists',
        };
        return response;
      }

      const newUser = await this.userRepository.create(createUserDto);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'User created successfully',
        content: newUser,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'An error occurred while creating the user',
      };
    }
    return response;
  }

  async getAllUsers(): Promise<GetAllUsers> {
    let response: GetAllUsers | null = null;
    try {
      const users = await this.userModel.find().exec();
      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all users successfully',
        content: users,
      };
      return response;
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async getUserById(id: string): Promise<UsersResponseDTO> {
    let response: UsersResponseDTO | null = null;
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `User with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'User fetched successfully',
        content: user,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async searchUsers(query: QueryUserDto) {
    try {
      const result = await this.userRepository.findAllWithFilters(query);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Users fetched successfully',
        ...result,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error searching users: ${error.message}`,
      };
    }
  }

  async searchUsersByName(keyword: string, page = 1, limit = 10) {
    if (!keyword || !keyword.trim()) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const { data, total } = await this.userRepository.searchByName(
      keyword.trim(),
      skip,
      currentLimit,
    );

    return {
      data: data.map((user) => this.mapToResponseDto(user)),
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  }

  async updateUser(
    id: string,
    updateData: Partial<CreateUsersDTO>,
  ): Promise<UsersResponseDTO> {
    try {
      const updatedUser = await this.userRepository.update(id, updateData);

      if (!updatedUser) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Agency with ID ${id} not found`,
          content: updatedUser || undefined,
        };
      }

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Agency updated successfully',
        content: updatedUser,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: undefined,
      };
    }
  }

  async deleteUser(id: string): Promise<MessageResponse> {
    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `User with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
      message: `User ${deletedUser.username} deleted successfully`,
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UsersResponseDTO | null> {
    let response: UsersResponseDTO | null = null;
    try {
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `User with username ${username} not found`,
        };

        return response;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `User with password ${password} might be wrong`,
        };
      }
      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: `Validated user success`,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
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
