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
import { UsersService } from 'users/services/users.service';
import { CreateUsersDTO } from 'users/dto/create-users.dto';
import { UsersResponseDTO } from 'users/dto/users.res';
import { PaginationDto, PaginatedResponseDto } from 'common/dto/pagination.dto';
import { JwtAuthGuard } from 'auth/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUsersDTO,
  ): Promise<UsersResponseDTO> {
    return this.usersService.createUser(createUserDto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(): Promise<{ totalUsers: number }> {
    return this.usersService.getUserStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UsersResponseDTO>> {
    return this.usersService.getAllUsers(paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<UsersResponseDTO> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: Partial<CreateUsersDTO>,
  ): Promise<UsersResponseDTO> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.deleteUser(id);
  }
}
