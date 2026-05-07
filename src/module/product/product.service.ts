import { LoggerService } from '@common/logs/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductRepository } from '@repositories/product.repository';
import { Product } from '@schemas/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.req';
import { ProductResponseDto } from './dto/product.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES } from '@common/constants/error.const';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '@common/dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductService>,
    private readonly productRepository: ProductRepository,
    private readonly logger: LoggerService,
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const {
        inv_itemCode,
        inv_itemName,
        inv_unitCode,
        inv_unitPrice,
        ma_thue,
      } = createProductDto;
      if (!inv_itemCode || !ma_thue) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: name, price or taxRate',
        };
        return response;
      }

      const duplicatedProduct = await this.productModel.findOne({
        inv_itemCode,
      });
      if (duplicatedProduct) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Product already exists',
        };
        return response;
      }

      const newProduct = new this.productModel({
        inv_itemCode,
        inv_itemName,
        inv_unitCode,
        inv_unitPrice,
        ma_thue,
      });

      console.log(newProduct);

      await newProduct.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Product created successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: 'An error occurred while creating the product',
      };
    }
    return response;
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} dose not in database`);
    }
    return this.mapToResponseDto(product);
  }

  async getAllProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { data, total } = await this.productRepository.findAll(
      paginationDto.skip,
      paginationDto.limit,
    );
    return {
      data: data.map((product) => this.mapToResponseDto(product)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  async updateProduct(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    const updatedProduct = await this.productRepository.update(id, updateData);
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} does not in database`);
    }
    return this.mapToResponseDto(updatedProduct);
  }

  async deleteProduct(id: string): Promise<MessageResponse> {
    const deletedProduct = await this.productRepository.delete(id);
    if (!deletedProduct) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: 'FAIL',
        message: `Product with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: 'SUCCESS',
      message: `Product ${deletedProduct.inv_itemCode} deleted successfully`,
    };
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    const response = new ProductResponseDto();
    response.content = product.toObject();
    return response;
  }
}
