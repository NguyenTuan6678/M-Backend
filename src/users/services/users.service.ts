import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '@users/repositories/users.repository';
import { CreateUsersDTO } from '@users/dto/create-users.dto';
import { UsersResponseDTO } from '@users/dto/users.res';
import { plainToClass } from 'class-transformer';
import { LoggerService } from '@common/logs/logger.service';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async createUser(createUserDto: CreateUsersDTO): Promise<UsersResponseDTO> {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.username,
    );
    if (existingUser) {
      this.logger.warn(`User already exists: ${createUserDto.username}`);
      throw new BadRequestException(
        'Already have this Username, please take another one',
      );
    }
    const newUser = await this.userRepository.create(createUserDto);
    return this.mapToResponseDto(newUser);
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
    const user = await this.userRepository.findByEmail(username);
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
