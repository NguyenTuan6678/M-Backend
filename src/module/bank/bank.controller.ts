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
import { BankService } from './bank.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBankDto } from './dto/create-bank.req';
import { BankResponseDto } from './dto/bank.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { GetAllBanks } from './dto/get-all-bank.res';

@ApiTags('Bank')
@Controller('banks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @ApiResponse({ status: 404, description: 'Can not create bank.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    createBankDto: CreateBankDto,
  ): Promise<BankResponseDto | null> {
    return this.bankService.createBank(createBankDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of banks' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async findAll(): Promise<GetAllBanks> {
    return this.bankService.getAllBanks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async findOne(@Param('id') id: string): Promise<BankResponseDto | null> {
    return this.bankService.getBankById(id);
  }

  @Get('seacrch-bank/search')
  @ApiOperation({ summary: 'Search banks by name' })
  @ApiResponse({ status: 200, description: 'Success.' })
  async searchAgencies(
    @Query('keyword') keyword: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.bankService.searchBanksByName(
      keyword,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    updateBankDto: Partial<CreateBankDto>,
  ): Promise<BankResponseDto | null> {
    return this.bankService.updateBank(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return this.bankService.deleteBank(id);
  }
}
