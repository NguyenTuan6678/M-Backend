import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '@users/users.service';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUsersDTO,
  ): Promise<UsersResponseDTO> {
    return this.usersService.createUser(createUserDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @UseGuards(JwtAuthGuard)
  async getStats(): Promise<{ totalUsers: number }> {
    return this.usersService.getUserStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of users' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UsersResponseDTO>> {
    return this.usersService.getAllUsers(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UsersResponseDTO> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: Partial<CreateUsersDTO>,
  ): Promise<UsersResponseDTO> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return this.usersService.deleteUser(id);
  }
}
