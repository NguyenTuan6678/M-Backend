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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { QueryEmployeeDto } from './dto/query-employee.req';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create.employee.req';
import { EmployeeResponseDto } from './dto/employee.res';

@ApiTags('Employee')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new employee' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.createEmployee(createEmployeeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all employees with optional filters & pagination',
    description:
      'Filter theo: departmentId, isActive. ' +
      'Text search employeeNumber, employeeName, employeeEmail, employeePhone qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllEmployees(
    @Query()
    query: QueryEmployeeDto,
  ) {
    return await this.employeeService.searchEmployees(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto | null> {
    return await this.employeeService.getEmployeeById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated employee by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.employeeService.deleteEmployee(id);
  }
}
