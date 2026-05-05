import { Module } from '@nestjs/common';
import { Product, ProductSchema } from './schemas/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { ProductRepository } from './repositories/product.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, LoggerService, JwtAuthGuard],
  exports: [ProductService, ProductRepository, MongooseModule],
})
export class ProductModule {}
