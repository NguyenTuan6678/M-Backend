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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async findAll(): Promise<GetAllAgencies> {
    return this.agencyService.getAllAgencies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  async findOne(@Param('id') id: string): Promise<AgencyResponseDto | null> {
    return this.agencyService.getAgencyById(id);
  }

  @Get('search-name/search')
  @ApiOperation({ summary: 'Search agencies by name' })
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
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<MessageResponse> {
    return this.agencyService.deleteAgency(id);
  }
}
