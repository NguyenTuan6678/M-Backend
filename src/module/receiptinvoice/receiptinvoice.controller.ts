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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReceiptInvoiceService } from './receiptinvoice.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CreateReceiptInvoiceDto } from './dto/create-receiptinvoice.req';
import { UpdateReceiptInvoiceDto } from './dto/update-receiptinvoice.req';
import { ReceiptInvoiceResponseDto } from './dto/reiptinvoice.res';
import { MessageResponse } from '@app-types/message.res';
import { QueryReceiptInvoiceDto } from './dto/query-receiptinvoice.req';

@ApiTags('ReceiptInvoice')
@Controller('receiptinvoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ReceiptInvoiceController {
  constructor(private readonly receiptService: ReceiptInvoiceService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new receiptinvoice' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    createReceiptDto: CreateReceiptInvoiceDto,
  ): Promise<ReceiptInvoiceResponseDto> {
    return await this.receiptService.createReceipt(createReceiptDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all receipt invoices with optional filters & pagination',
    description:
      'Filter theo: inv_invoiceSeries, tax_code. ' +
      'Text search inv_invoiceSeries, tax_code qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllReceiptInvoices(
    @Query()
    query: QueryReceiptInvoiceDto,
  ) {
    return await this.receiptService.searchReceiptInvoices(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receiptinvoice by ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ReceiptInvoiceResponseDto | null> {
    return await this.receiptService.getReceiptById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated receiptinvoice by ID' })
  async update(
    @Param('id') id: string,
    @Body()
    updateReceiptInvoiceDto: UpdateReceiptInvoiceDto,
  ): Promise<ReceiptInvoiceResponseDto> {
    return await this.receiptService.updateReceipt(id, updateReceiptInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receiptinvoicenk by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.receiptService.deleteReceipt(id);
  }
}
