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
  Req,
} from '@nestjs/common';
import { UsersService } from '@users/users.service';
import { CreateUsersDTO } from '@users/dto/create-users.req';
import { UsersResponseDTO } from '@users/dto/users.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';
import { QueryUserDto } from './dto/query-user.req';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() request: any,
    @Body(ValidationPipe) createUserDto: CreateUsersDTO,
  ): Promise<UsersResponseDTO> {
    return await this.usersService.createUser(createUserDto, request.user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @UseGuards(JwtAuthGuard)
  async getStats(): Promise<{ totalUsers: number }> {
    return await this.usersService.getUserStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users with optional filters & pagination',
    description:
      'Filter theo: isActive, role. ' +
      'Text search username qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllUsers(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryUserDto,
  ) {
    return await this.usersService.searchUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UsersResponseDTO> {
    return await this.usersService.getUserById(id);
  }

  // @Get('search-name/search')
  // @ApiOperation({ summary: 'Search user by name' })
  // async searchAgencies(
  //   @Query('keyword') keyword: string,
  //   @Query('page') page = '1',
  //   @Query('limit') limit = '10',
  // ) {
  //   return this.usersService.searchUsersByName(
  //     keyword,
  //     Number(page),
  //     Number(limit),
  //   );
  // }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: Partial<CreateUsersDTO>,
  ): Promise<UsersResponseDTO> {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.usersService.deleteUser(id);
  }
}
