import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReceiptInvoiceRepository } from '@repositories/receiptinvoice.repository';
import {
  ReceiptInvoice,
  ReceiptInvoiceDocument,
} from '@schemas/receiptinvoice.schema';
import { Model } from 'mongoose';
import { CreateReceiptInvoiceDto } from './dto/create-receiptinvoice.req';
import { ReceiptInvoiceResponseDto } from './dto/reiptinvoice.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { QueryReceiptInvoiceDto } from './dto/query-receiptinvoice.req';

@Injectable()
export class ReceiptInvoiceService {
  constructor(
    @InjectModel(ReceiptInvoice.name)
    private receiptModel: Model<ReceiptInvoiceDocument>,
    private readonly receiptInvoiceRepository: ReceiptInvoiceRepository,
  ) {}

  async createReceipt(
    createReceiptDto: CreateReceiptInvoiceDto,
  ): Promise<ReceiptInvoiceResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { inv_invoiceSeries, tax_code } = createReceiptDto;
      if (!inv_invoiceSeries) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: inv_invoiceSeries',
        };
        return response;
      }

      const duplicatedReceipt = await this.receiptModel.findOne({
        inv_invoiceSeries,
      });

      if (duplicatedReceipt) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'inv_invoiceSeries already exists',
        };
        return response;
      }

      const newReceipt =
        await this.receiptInvoiceRepository.create(createReceiptDto);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'inv_invoiceSeries created successfully',
        content: newReceipt,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: 'An error occurred while creating the inv_invoiceSeries',
      };
    }
    return response;
  }

  async searchReceiptInvoices(query: QueryReceiptInvoiceDto) {
    try {
      const result =
        await this.receiptInvoiceRepository.findAllWithFilters(query);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Receipt invoices fetched successfully',
        ...result,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error searching receipt invoices: ${error.message}`,
      };
    }
  }

  async getReceiptById(id: string): Promise<ReceiptInvoiceResponseDto | null> {
    let response: ReceiptInvoiceResponseDto | null = null;
    try {
      const receipt = await this.receiptInvoiceRepository.findById(id);

      if (!receipt) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Receipt with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Employee fetched successfully',
        content: receipt,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while getting receipt by id: ${error.message}`,
      };
    }
    return response;
  }

  async updateReceipt(
    id: string,
    updateData: Partial<CreateReceiptInvoiceDto>,
  ): Promise<ReceiptInvoiceResponseDto> {
    try {
      const updatedReceipt = await this.receiptInvoiceRepository.update(
        id,
        updateData,
      );

      if (!updatedReceipt) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `ReceiptInvoice with ID ${id} not found`,
          content: updatedReceipt || undefined,
        };
      }

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'ReceiptInvoice updated successfully',
        content: updatedReceipt,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while updating the product: ${error.message}`,
        content: undefined,
      };
    }
  }

  async deleteReceipt(id: string): Promise<MessageResponse> {
    const deletedReceipt = await this.receiptInvoiceRepository.delete(id);
    if (!deletedReceipt) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `ReceiptInvoice with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
      message: `ReceiptInvoice ${deletedReceipt.inv_invoiceSeries} deleted successfully`,
    };
  }
}
