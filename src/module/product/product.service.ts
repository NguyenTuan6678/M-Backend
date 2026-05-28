import { Injectable } from '@nestjs/common';
import { ProductRepository } from '@repositories/product.repository';
import { ProductDocument } from '@schemas/product.schema';
import { CreateProductDto } from './dto/create-product.req';
import { ProductResponseDto } from './dto/product.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { QueryProductDto } from './dto/query-product.req';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    let response: MessageResponse | null = null;
    try {
      const { ma_thue } = createProductDto;

      if (!ma_thue) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Missing required fields: ma_thue',
        };
      }

      const newProduct = await this.productRepository.create(createProductDto);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Product created successfully',
        content: newProduct,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while creating the product: ${error.message}`,
      };
    }
    return response;
  }

  async searchProducts(query: QueryProductDto) {
    try {
      const result = await this.productRepository.findAllWithFilters(query);

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Products fetched successfully',
        ...result,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Error searching products: ${error.message}`,
      };
    }
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    let response: ProductResponseDto | null = null;
    try {
      const product = await this.productRepository.findById(id);

      if (!product) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Product with ID ${id} not found`,
        };

        return response;
      }

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Product fetched successfully',
        content: product,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `An error occurred while get product by id: ${error.message}`,
      };
    }
    return response;
  }

  async updateProduct(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto | null> {
    try {
      const updatedProduct = await this.productRepository.update(
        id,
        updateData,
      );

      if (!updatedProduct) {
        return {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: `Product with ID ${id} not found`,
          content: undefined,
        };
      }

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Product updated successfully',
        content: updatedProduct,
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

  async deleteProduct(id: string): Promise<MessageResponse> {
    const deletedProduct = await this.productRepository.delete(id);
    if (!deletedProduct) {
      return {
        code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `Product with ID ${id} not found`,
      };
    }
    return {
      code: ERROR_RES.SUCCESS.statusCode,
      info: ERROR_INFO.SUCCESS,
      message: `Product ${deletedProduct.inv_itemCode} deleted successfully`,
    };
  }
}
