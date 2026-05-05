import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from '@product/dto/create-product.req';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
