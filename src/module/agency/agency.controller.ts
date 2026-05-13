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
import { AgencyService } from './agency.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgencyResponseDto } from './dto/agency.res';
import { CreateAgencyDto } from './dto/create-agency.req';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { MessageResponse } from '@app-types/message.res';

@ApiTags('Agency')
@Controller('agencies')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 404, description: 'Can not create agency.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agencyService.createAgency(createAgencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of agencies' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<AgencyResponseDto>> {
    return this.agencyService.getAllAgencies(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  async findOne(@Param('id') id: string): Promise<AgencyResponseDto> {
    return this.agencyService.getAgencyById(id);
  }

  @Get('/search-name/search')
  @ApiOperation({ summary: 'Search agencies by name' })
  @ApiResponse({ status: 200, description: 'Success.' })
  async searchAgencies(
    @Query('keyword') keyword: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.agencyService.searchAgenciesByName(
      keyword,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agencyService.updateAgency(id, updateAgencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency by ID' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<MessageResponse> {
    return this.agencyService.deleteAgency(id);
  }
}
