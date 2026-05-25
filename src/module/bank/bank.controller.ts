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
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { QueryBankDto } from './dto/query-bank.req';

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
  @ApiOperation({
    summary: 'Get all banks with optional filters & pagination',
    description:
      'Filter theo: isActive. ' +
      'Text search inv_buyerBankName qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllBanks(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryBankDto,
  ) {
    return await this.bankService.searchBanks(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank by ID' })
  async findOne(@Param('id') id: string): Promise<BankResponseDto | null> {
    return this.bankService.getBankById(id);
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
    updateBankDto: Partial<CreateBankDto>,
  ): Promise<BankResponseDto | null> {
    return this.bankService.updateBank(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return this.bankService.deleteBank(id);
  }
}
