import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.req';
import { DepartmentResponseDto } from './dto/department.res';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@ApiTags('Department')
@Controller('departments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @ApiResponse({ status: 404, description: 'Can not create department.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentService.createDepartment(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of banks' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<DepartmentResponseDto>> {
    return await this.departmentService.getAllDepartments(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async findOne(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return await this.departmentService.getDepartmentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBankDto: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentService.updateDepartment(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.departmentService.deleteDepartment(id);
  }
}
