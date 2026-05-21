import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from '../module/product/dto/create-product.req';
import { Product, ProductDocument } from '@schemas/product.schema';
import { Model } from 'mongoose';
import { QueryProductDto } from '@module/product/dto/query-product.req';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private logger: LoggerService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    try {
      const newProduct = new this.productModel(createProductDto);
      const savedProduct = await newProduct.save();
      this.logger.log(
        `Product created: ${savedProduct.inv_itemCode}`,
        'ProductRepository',
      );
      return savedProduct;
    } catch (error: any) {
      this.logger.error(`Error creating product: ${error.message}`, undefined);
      throw error;
    }
  }

  async findAllWithFilters(query: QueryProductDto): Promise<{
    data: ProductDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { isActive, ma_thue, search, minPrice, maxPrice } = query;

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (ma_thue) {
        filter.ma_thue = ma_thue;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.inv_unitPrice = {};

        if (minPrice !== undefined) {
          filter.inv_unitPrice.$gte = minPrice;
        }

        if (maxPrice !== undefined) {
          filter.inv_unitPrice.$lte = maxPrice;
        }
      }

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { inv_itemCode: { $regex: safeSearch, $options: 'i' } },
          { inv_itemName: { $regex: safeSearch, $options: 'i' } },
          { inv_unitCode: { $regex: safeSearch, $options: 'i' } },
          { ma_thue: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.productModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.productModel.countDocuments(filter).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error(
        `Error finding products with filters: ${error.message}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ProductDocument | null> {
    try {
      return await this.productModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding product by ID: ${error.message}`);
      throw error;
    }
  }

  async findByIds(ids: string[]) {
    return this.productModel.find({
      _id: { $in: ids },
    });
  }

  async update(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<ProductDocument | null> {
    try {
      return await this.productModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error updating product: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<ProductDocument | null> {
    try {
      const deletedProduct = await this.productModel
        .findByIdAndDelete(id)
        .exec();
      if (deletedProduct) {
        this.logger.log(
          `Product deleted: ${deletedProduct.inv_itemCode}`,
          'ProductRepository',
        );
      }
      return deletedProduct;
    } catch (error: any) {
      this.logger.error(`Error deleting product: ${error.message}`);
      throw error;
    }
  }
}
