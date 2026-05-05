import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.req';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
