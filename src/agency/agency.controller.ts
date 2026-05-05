import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AgencyService } from '@agency/agency.service';
import { ApiOperation } from '@nestjs/swagger';
import { AgencyResponseDto } from '@agency/dto/agency.res';
import { CreateAgencyDto } from '@agency/dto/create-agency.req';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

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
}
