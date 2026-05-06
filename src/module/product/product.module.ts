import { Module } from '@nestjs/common';
import { Product, ProductSchema } from '@schemas/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from '@repositories/product.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, LoggerService, JwtAuthGuard],
  exports: [ProductService, ProductRepository, MongooseModule],
})
export class ProductModule {}
