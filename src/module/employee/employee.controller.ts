import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create.employee.req';
import { EmployeeResponseDto } from './dto/employee.res';
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
import { ApiOperation } from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new employee' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.createEmployee(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of employees' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<EmployeeResponseDto>> {
    return await this.employeeService.getAllEmployees(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return await this.employeeService.getEmployeeById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated employee by ID' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEmployeeDto: Partial<CreateEmployeeDto>,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.employeeService.deleteEmployee(id);
  }
}
