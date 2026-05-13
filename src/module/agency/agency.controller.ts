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
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { MessageResponse } from '@app-types/message.res';
import { GetAllAgencies } from './dto/get-all-agency.res';

@ApiTags('Agency')
@Controller('agencies')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 201, description: 'Agency created successfully.' })
  @ApiResponse({ status: 400, description: 'Missing required fields.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto | null> {
    return this.agencyService.createAgency(createAgencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agencies' })
  @ApiResponse({ status: 200, description: 'Success.' })
  async findAll(): Promise<GetAllAgencies> {
    return this.agencyService.getAllAgencies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  async findOne(@Param('id') id: string): Promise<AgencyResponseDto | null> {
    return this.agencyService.getAgencyById(id);
  }

  @Get('search-name/search')
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
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    updateAgencyDto: Partial<CreateAgencyDto>,
  ): Promise<AgencyResponseDto | null> {
    return this.agencyService.updateAgency(id, updateAgencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency by ID' })
  @ApiResponse({ status: 200, description: 'Agency deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Agency not found.' })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<MessageResponse> {
    return this.agencyService.deleteAgency(id);
  }
}
