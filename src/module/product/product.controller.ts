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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.req';
import { ProductResponseDto } from './dto/product.res';
import { MessageResponse } from '@app-types/message.res';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { QueryProductDto } from './dto/query-product.req';

@ApiTags('Product')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new bank' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all products with optional filters & pagination',
    description:
      'Filter theo: isActive, ma_thue, minPrice, maxPrice. ' +
      'Text search inv_itemCode, inv_itemName, inv_unitCode, ma_thue qua param search. ' +
      'Phân trang qua page và limit.',
  })
  async getAllProducts(
    @Query()
    query: QueryProductDto,
  ) {
    return await this.productService.searchProducts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank by ID' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.productService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updated bank by ID' })
  async update(
    @Param('id') id: string,
    @Body()
    updateProductDto: CreateProductDto,
  ): Promise<ProductResponseDto | null> {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<MessageResponse> {
    return await this.productService.deleteProduct(id);
  }
}
