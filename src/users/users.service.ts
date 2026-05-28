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
    try {
      if (currentUser.role !== Role.ADMIN) {
        return {
          code: ERROR_RES.FORBIDDEN_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Only ADMIN can create user accounts',
        };
      }

      const { username, password } = createUserDto;

      if (!username || !password) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: username or password',
        };
      }

      const duplicateUser = await this.userModel.findOne({ username });

      if (duplicateUser) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Username already exists',
        };
      }

      const newUser = await this.userRepository.create({
        ...createUserDto,
        role: Role.USER,
      });

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'User created successfully',
        content: newUser,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while creating the user: ${error.message}`,
      };
    }
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
        message: `There is a problem while fetching user by id: ${error.message}`,
      };
    }
    return response;
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
        message: `There is a problem while updating the user: ${error.message}`,
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
        message: `There is a problem while validating user: ${error.message}`,
      };
    }
    return response;
  }

  async getUserStats(): Promise<{ totalUsers: number }> {
    const total = await this.userRepository.countAll();
    return { totalUsers: total };
  }
}
