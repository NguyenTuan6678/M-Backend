import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AgencyService } from './agency.service';
import { ApiOperation } from '@nestjs/swagger';
import { AgencyResponseDto } from './dto/agency.res';
import { CreateAgencyDto } from './dto/create-agency.req';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { MessageResponse } from '@app-types/message.res';

@Controller('agencies')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new agency' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agencyService.createAgency(createAgencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of agencies' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<AgencyResponseDto>> {
    return this.agencyService.getAllAgencies(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  async findOne(@Query('id') id: string): Promise<AgencyResponseDto> {
    return this.agencyService.getAgencyById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency by ID' })
  async update(
    @Query('id') id: string,
    @Body(ValidationPipe) updateAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agencyService.updateAgency(id, updateAgencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency by ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Query('id') id: string): Promise<MessageResponse> {
    return this.agencyService.deleteAgency(id);
  }
}
