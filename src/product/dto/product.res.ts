import { Product } from '@schemas/product.schema';
import { MessageResponse } from '@app-types/message.res';

export class ProductResponseDto extends MessageResponse {
  content?: Product;
}
