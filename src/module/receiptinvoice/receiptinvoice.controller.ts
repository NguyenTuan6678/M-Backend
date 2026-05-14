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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReceiptInvoiceService } from './receiptinvoice.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { CreateReceiptInvoiceDto } from './dto/create-receiptinvoice.req';
import { ReceiptInvoiceResponseDto } from './dto/reiptinvoice.res';
import { GetAllReceiptInvoices } from './dto/get-all-reiptinvoice.res';
import { MessageResponse } from '@app-types/message.res';

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
    @Body(ValidationPipe) createReceiptDto: CreateReceiptInvoiceDto,
  ): Promise<ReceiptInvoiceResponseDto> {
    return await this.receiptService.createReceipt(createReceiptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of receiptinvoices' })
  async findAll(): Promise<GetAllReceiptInvoices> {
    return await this.receiptService.getAllReceipts();
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
    @Body(ValidationPipe) updateEmployeeDto: Partial<CreateReceiptInvoiceDto>,
  ): Promise<ReceiptInvoiceResponseDto> {
    return await this.receiptService.updateReceipt(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receiptinvoicenk by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.receiptService.deleteReceipt(id);
  }
}
