import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { SaleTransactionImportService } from './sale-transaction-import.service';

@ApiTags('Sale Transaction Import')
@Controller('sale-transaction/import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class SaleTransactionImportController {
  constructor(
    private readonly saleTransactionImportService: SaleTransactionImportService,
  ) {}

  @Post('preview')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Preview a sheet data before import' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const isExcel =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.endsWith('.xlsx');

        if (!isExcel) {
          return callback(
            new BadRequestException('Only .xlsx files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded Excel file is empty');
    }

    console.log('[IMPORT FILE]', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer.length,
    });

    return await this.saleTransactionImportService.preview(file.buffer);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import the preview data sheet' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const isExcel =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.endsWith('.xlsx');

        if (!isExcel) {
          return callback(
            new BadRequestException('Only .xlsx files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded Excel file is empty');
    }

    return await this.saleTransactionImportService.import(file.buffer);
  }
}
