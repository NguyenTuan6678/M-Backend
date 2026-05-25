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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { QueryDepartmentDto } from './dto/query-department.req';

@ApiTags('Department')
@Controller('departments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentService.createDepartment(createDepartmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all departments with optional filters & pagination',
    description:
      'Filter theo: isActive. ' +
      'Text search departmentNumber, departmentName, departmentDescription qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllDepartments(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryDepartmentDto,
  ) {
    return await this.departmentService.searchDepartments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<DepartmentResponseDto | null> {
    return await this.departmentService.getDepartmentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  async update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    updateBankDto: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentService.updateDepartment(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.departmentService.deleteDepartment(id);
  }
}
