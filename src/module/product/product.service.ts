import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductRepository } from '@repositories/product.repository';
import { Product, ProductDocument } from '@schemas/product.schema';
import { LoggerService } from '@common/logs/logger.service';
import { CreateProductDto } from './dto/create-product.req';
import { ProductResponseDto } from './dto/product.res';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_INFO, ERROR_RES } from '@common/constants/error.const';
import { GetAllProducts } from './dto/get-all-product.res';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly productRepository: ProductRepository,
    private readonly logger: LoggerService,
  ) {}

  private calculateFields(
    inv_unitPrice: number,
    inv_quantity: number,
    inv_discountAmount: number,
    ma_thue: string,
  ) {
    const A = inv_unitPrice;
    const B = inv_quantity;
    const C = inv_discountAmount;
    const D = parseFloat(ma_thue) / 100;

    const G = A * B - C; // inv_TotalAmountWithoutVat
    const F = G * D; // inv_vatAmount
    const E = G + F; // inv_TotalAmount

    return {
      inv_TotalAmountWithoutVat: G,
      inv_vatAmount: F,
      inv_TotalAmount: E,
    };
  }

  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const {
        inv_itemCode,
        inv_itemName,
        inv_unitCode,
        inv_unitPrice,
        inv_quantity,
        inv_discountAmount,
        ma_thue,
      } = createProductDto;

      if (!inv_itemCode || !ma_thue) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: 'Missing required fields: inv_itemCode or ma_thue',
        };
      }

      const duplicatedProduct = await this.productModel.findOne({
        inv_itemCode,
      });
      if (duplicatedProduct) {
        return {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: 'FAIL',
          message: `Product with code ${inv_itemCode} already exists`,
        };
      }

      const calculated = this.calculateFields(
        inv_unitPrice,
        inv_quantity,
        inv_discountAmount,
        ma_thue,
      );

      const newProduct = new this.productModel({
        inv_itemCode,
        inv_itemName,
        inv_unitCode,
        inv_unitPrice,
        inv_quantity,
        inv_discountAmount,
        ma_thue,
        ...calculated, // inv_TotalAmountWithoutVat, inv_vatAmount, inv_TotalAmount
      });

      await newProduct.save();
      this.logger.log(`Product created: ${inv_itemCode}`, 'ProductService');

      return {
        code: ERROR_RES.SUCCESS.statusCode,
        info: 'SUCCESS',
        message: 'Product created successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Error creating product: ${error.message}`,
        'ProductService',
      );
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: 'FAIL',
        message: 'An error occurred while creating the product',
      };
    }
  }

  async getAllProducts(): Promise<GetAllProducts> {
    let response: GetAllProducts | null = null;
    try {
      const products = await this.productModel.find().exec();
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Get all products successfully',
        content: products,
      };
      return response;
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
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
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Product fetched successfully',
        content: product,
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async searchProductsByName(keyword: string, page = 1, limit = 10) {
    if (!keyword || !keyword.trim()) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const { data, total } = await this.productRepository.searchByCode(
      keyword.trim(),
      skip,
      currentLimit,
    );

    return {
      data: data.map((agency) => this.mapToResponseDto(agency)),
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  }

  async updateProduct(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto | null> {
    try {
      // Nếu update bất kỳ field nào ảnh hưởng tính toán → recalculate
      if (
        updateData.inv_unitPrice !== undefined ||
        updateData.inv_quantity !== undefined ||
        updateData.inv_discountAmount !== undefined ||
        updateData.ma_thue !== undefined
      ) {
        const existing = await this.productRepository.findById(id);

        if (!existing) {
          return {
            code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
            info: ERROR_INFO.FAIL,
            message: `Product with ID ${id} not found`,
            content: undefined,
          };
        }

        const calculated = this.calculateFields(
          updateData.inv_unitPrice ?? existing.inv_unitPrice,
          updateData.inv_quantity ?? existing.inv_quantity,
          updateData.inv_discountAmount ?? existing.inv_discountAmount,
          updateData.ma_thue ?? existing.ma_thue,
        );

        updateData = {
          ...updateData,
          ...calculated,
        };
      }

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
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Product updated successfully',
        content: updatedProduct,
      };
    } catch (error: any) {
      return {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: undefined,
      };
    }
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
