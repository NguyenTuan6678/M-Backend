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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBankDto } from './dto/create-bank.req';
import { BankResponseDto } from './dto/bank.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@ApiTags('Bank')
@Controller('banks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createBankDto: CreateBankDto,
  ): Promise<BankResponseDto> {
    return await this.bankService.createBank(createBankDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of banks' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<BankResponseDto>> {
    return await this.bankService.getAllBanks(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank by ID' })
  async findOne(@Param('id') id: string): Promise<BankResponseDto> {
    return await this.bankService.getBankById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBankDto: Partial<CreateBankDto>,
  ): Promise<BankResponseDto> {
    return await this.bankService.updateBank(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.bankService.deleteBank(id);
  }
}
