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
import { ProductService } from './product.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.req';
import { ProductResponseDto } from './dto/product.res';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@ApiTags('Product')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @ApiResponse({ status: 404, description: 'Can not create product.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of banks' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findAll(
    @Query(ValidationPipe) paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return await this.productService.getAllProducts(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.productService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProductDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.productService.deleteProduct(id);
  }
}
