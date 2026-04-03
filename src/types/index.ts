export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export type ProductStatus = 'active' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock_quantity: number;
  minStockThreshold: number;
  status: ProductStatus;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  priceAtTime: number;
}

export interface Order {
  id: string;
  orderId?: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export type RestockPriority = 'high' | 'medium' | 'low';

export type RestockStatus = 'pending' | 'completed';

export interface RestockItem {
  restock_id: string;
  productId: string;
  name: string;
  addedAt: string;
  priority: RestockPriority;
  status: RestockStatus;
  stock_quantity: number;
  min_stock_threshold: number;
  category_name?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  userEmail?: string;
}
