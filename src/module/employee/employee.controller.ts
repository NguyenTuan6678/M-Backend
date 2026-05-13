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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { GetAllEmployees } from './dto/get-all-employee.res';

@ApiTags('Employee')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 404, description: 'Can not create employee.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.createEmployee(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of employees' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async findAll(): Promise<GetAllEmployees> {
    return await this.employeeService.getAllEmployees();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto | null> {
    return await this.employeeService.getEmployeeById(id);
  }

  @Get('search-name/search')
  @ApiOperation({ summary: 'Search employees by name' })
  @ApiResponse({ status: 200, description: 'Success.' })
  async searchEmployees(
    @Query('keyword') keyword: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.employeeService.searchEmployeesByName(
      keyword,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated employee by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEmployeeDto: Partial<CreateEmployeeDto>,
  ): Promise<EmployeeResponseDto> {
    return await this.employeeService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.employeeService.deleteEmployee(id);
  }
}
