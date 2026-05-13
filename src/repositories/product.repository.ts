import { LoggerService } from '@common/logs/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from '../module/product/dto/create-product.req';
import { Product, ProductDocument } from '@schemas/product.schema';
import { Model } from 'mongoose';

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

  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: ProductDocument[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.productModel
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.productModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error fetching products: ${error.message}`);
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

  async searchByCode(
    keyword: string,
    skip = 0,
    limit = 10,
  ): Promise<{ data: ProductDocument[]; total: number }> {
    try {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const filter = {
        inv_itemCode: {
          $regex: safeKeyword,
          $options: 'i',
        },
      };

      const [data, total] = await Promise.all([
        this.productModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),

        this.productModel.countDocuments(filter).exec(),
      ]);

      return { data, total };
    } catch (error: any) {
      this.logger.error(`Error searching agency by name: ${error.message}`);
      throw error;
    }
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
