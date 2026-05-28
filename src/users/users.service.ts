import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@repositories/users.repository';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@schemas/users.schema';
import { Model, Types } from 'mongoose';
import { ERROR_RES, ERROR_INFO } from '@common/constants/error.const';
import { MessageResponse } from '@app-types/message.res';
import { Role } from '@utils/role.enum';
import { QueryUserDto } from './dto/query-users.req';
import { UpdateUserDto } from './dto/update-users.req';

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
    updateData: UpdateUserDto,
    currentUser: { id: string; username: string; role: Role },
  ): Promise<UsersResponseDTO> {
    try {
      if (currentUser.role !== Role.ADMIN) {
        return {
          code: ERROR_RES.FORBIDDEN_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Only ADMIN can update user accounts',
          content: undefined,
        };
      }

      if (!Types.ObjectId.isValid(id)) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Invalid user id',
          content: undefined,
        };
      }

      const user = await this.userModel.findById(id).select('+password');

      if (!user) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `User with ID ${id} not found`,
          content: undefined,
        };
      }

      /**
       * Nếu update username thì check trùng username.
       */
      if (updateData.username && updateData.username !== user.username) {
        const duplicateUser = await this.userModel.findOne({
          username: updateData.username,
          _id: { $ne: user._id },
        });

        if (duplicateUser) {
          return {
            code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
            info: ERROR_INFO.FAIL,
            message: 'Username already exists',
            content: undefined,
          };
        }

        user.username = updateData.username;
      }

      /**
       * Rule role:
       * - Không cho đổi USER thành ADMIN nếu hệ thống đã có ADMIN.
       * - Không cho đổi ADMIN cuối cùng thành USER.
       */
      if (updateData.role !== undefined) {
        const currentTargetRole = user.role;
        const nextRole = updateData.role;

        if (nextRole === Role.ADMIN && currentTargetRole !== Role.ADMIN) {
          const existingAdmin = await this.userModel.findOne({
            role: Role.ADMIN,
          });

          if (existingAdmin) {
            return {
              code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
              info: ERROR_INFO.FAIL,
              message:
                'Cannot promote user to ADMIN because admin account already exists',
              content: undefined,
            };
          }
        }

        if (currentTargetRole === Role.ADMIN && nextRole !== Role.ADMIN) {
          const adminCount = await this.userModel.countDocuments({
            role: Role.ADMIN,
          });

          if (adminCount <= 1) {
            return {
              code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
              info: ERROR_INFO.FAIL,
              message: 'Cannot change role of the last ADMIN account',
              content: undefined,
            };
          }
        }

        user.role = nextRole;
      }

      /**
       * Reset password.
       * Vì dùng user.save(), pre-save hook sẽ tự hash password.
       */
      if (updateData.password) {
        user.password = updateData.password;
      }

      await user.save();

      const updatedUser = await this.userModel
        .findById(id)
        .select('-password')
        .exec();

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'User updated successfully',
        content: updatedUser || undefined,
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

  async deleteUser(
    id: string,
    currentUser: { id: string; username: string; role: Role },
  ): Promise<MessageResponse> {
    if (currentUser.role !== Role.ADMIN) {
      return {
        code: ERROR_RES.FORBIDDEN_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'Only ADMIN can delete user accounts',
      };
    }

    if (currentUser.id === id) {
      return {
        code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'You cannot delete your own account',
      };
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `User with ID ${id} not found`,
      };
    }

    if ((user as any).role === Role.ADMIN) {
      return {
        code: ERROR_RES.FORBIDDEN_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'Admin account cannot be deleted',
      };
    }

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
