import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SaleTransactionService } from '@module/sale-transaction/sale-transaction.service';
import { CreateSalesTransactionDto } from '@module/sale-transaction/dto/create-sale-transaction.req';
import { SaleTransactionResponseDTO } from '@module/sale-transaction/dto/sale-transaction.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { GetAllSaleTransactions } from './dto/get-all-sale-transaction.res';
import { MessageResponse } from '@app-types/message.res';

@ApiTags('Sale Transaction')
@Controller('sale-transaction')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CacheInterceptor)
@ApiBearerAuth('authorization')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @ApiResponse({ status: 201, description: 'Sale transaction created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @HttpCode(HttpStatus.CREATED)
  async createSaleTransaction(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const formattedErrors = errors.map((error) => ({
            field: error.property,
            messages: Object.values(error.constraints || {}),
            children: error.children?.map((child) => ({
              field: `${error.property}.${child.property}`,
              messages: Object.values(child.constraints || {}),
            })),
          }));

          return new BadRequestException({
            message: 'Validation failed',
            errors: formattedErrors,
          });
        },
      }),
    )
    createSalesTransactionDto: CreateSalesTransactionDto,
  ) {
    return await this.saleTransactionService.createSaleTransaction(
      createSalesTransactionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of sale transactions' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated sale transactions.',
  })
  async getAllSaleTransactions(): Promise<GetAllSaleTransactions> {
    return await this.saleTransactionService.getAllSaleTransactions();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sale transaction statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transaction statistics.',
  })
  async getSaleTransactionStats(): Promise<{ totalTransactions: number }> {
    return await this.saleTransactionService.getSaleTransactionStats();
  }

  @Get('search/date-range')
  @ApiOperation({ summary: 'Get sale transactions by date range' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transactions within a date range.',
  })
  async getSaleTransactionsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('by-employee/:employeeId')
  @ApiOperation({ summary: 'Get sale transactions by employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transactions for an employee.',
  })
  async getSaleTransactionsByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByEmployee(
      employeeId,
    );
  }

  @Get('by-agency/:agencyId')
  @ApiOperation({ summary: 'Get sale transactions by agency ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transactions for an agency.',
  })
  async getSaleTransactionsByAgency(
    @Param('agencyId') agencyId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByAgency(
      agencyId,
    );
  }

  @Get('by-department/:departmentId')
  @ApiOperation({ summary: 'Get sale transactions by department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transactions for a department.',
  })
  async getSaleTransactionsByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByDepartment(
      departmentId,
    );
  }

  @Get('by-bank/:bankId')
  @ApiOperation({ summary: 'Get sale transactions by bank ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns sale transactions for a bank.',
  })
  async getSaleTransactionsByBank(
    @Param('bankId') bankId: string,
  ): Promise<SaleTransactionResponseDTO[]> {
    return await this.saleTransactionService.getSaleTransactionsByBank(bankId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale transaction by ID' })
  @ApiResponse({ status: 200, description: 'Returns sale transaction by ID.' })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  async getSaleTransactionById(
    @Param('id') id: string,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.getSaleTransactionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale transaction' })
  @ApiResponse({ status: 200, description: 'Sale transaction updated.' })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  async updateSaleTransaction(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateSalesTransactionDto>,
  ): Promise<SaleTransactionResponseDTO> {
    return await this.saleTransactionService.updateSaleTransaction(
      id,
      updateData,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sale transaction' })
  @ApiResponse({ status: 200, description: 'Sale transaction deleted.' })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  async deleteSaleTransaction(
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return await this.saleTransactionService.deleteSaleTransaction(id);
  }

  @Post(':id/send-receipt')
  @ApiOperation({ summary: 'Build and send invoice payload for a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the mapped invoice payload.',
  })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  @HttpCode(HttpStatus.OK)
  async sendReceipt(@Param('id') id: string) {
    return await this.saleTransactionService.buildInvoicePayload(id);
  }
}
