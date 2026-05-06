import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaleTransactionService } from '@transaction/sale-transaction.service';
import { CreateSalesTransactionDto } from '@transaction/dto/create-sale-transaction.req';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { SaleTransactionResponseDTO } from '@transaction/dto/sale-transaction.res';

@ApiTags('sale-transaction')
@Controller('sale-transaction')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @ApiResponse({
    status: 201,
    description: 'The sale transaction has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Missing required fields or invalid data.',
  })
  @HttpCode(HttpStatus.CREATED)
  async createSaleTransaction(
    @Body(ValidationPipe) createSalesTransactionDto: CreateSalesTransactionDto,
  ) {
    return await this.saleTransactionService.createSaleTransaction(
      createSalesTransactionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of sale transactions' })
  async getAllSaleTransactions(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<SaleTransactionResponseDTO>> {
    return await this.saleTransactionService.getAllSaleTransactions(
      paginationDto,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sale transaction statistics' })
  async getSaleTransactionStats(): Promise<{ totalTransactions: number }> {
    return await this.saleTransactionService.getSaleTransactionStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale transaction by ID' })
  async getSaleTransactionById(
    @Param('id') id: string,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.getSaleTransactionById(id);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get sale transactions by employee ID' })
  async getSaleTransactionsByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByEmployee(
      employeeId,
    );
  }

  @Get('agency/:agencyId')
  @ApiOperation({ summary: 'Get sale transactions by agency ID' })
  async getSaleTransactionsByAgency(
    @Param('agencyId') agencyId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByAgency(
      agencyId,
    );
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get sale transactions by department ID' })
  async getSaleTransactionsByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByDepartment(
      departmentId,
    );
  }

  @Get('paid')
  @ApiOperation({ summary: 'Get all paid sale transactions' })
  async getPaidSaleTransactions(): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getPaidSaleTransactions();
  }

  @Get('unpaid')
  @ApiOperation({ summary: 'Get all unpaid sale transactions' })
  async getUnpaidSaleTransactions(): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getUnpaidSaleTransactions();
  }

  @Get('search/date-range')
  @ApiOperation({ summary: 'Get sale transactions by date range' })
  async getSaleTransactionsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('search/tax-code')
  @ApiOperation({ summary: 'Get sale transactions by tax code' })
  async getSaleTransactionsByTaxCode(
    @Query('taxCode') taxCode: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByTaxCode(
      taxCode,
    );
  }

  @Get('search/company-name')
  @ApiOperation({ summary: 'Get sale transactions by company name' })
  async getSaleTransactionsByCompanyName(
    @Query('companyName') companyName: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByCompanyName(
      companyName,
    );
  }

  @Get('search/email')
  @ApiOperation({ summary: 'Get sale transactions by email' })
  async getSaleTransactionsByEmail(
    @Query('email') email: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByEmail(email);
  }
}
