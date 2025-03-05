import { Cart } from 'src/cart/entities/cart.entity';
import { Product } from 'src/product/entities/product.entity';

export type CartWithProducts = Cart & {
  products: Product;
  reference_id: string;
};

export interface XenditCartItem {
  name: string;
  category: string;
  quantity: number;
  price: number;
}
