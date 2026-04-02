import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  User, Category, Product, Order, RestockItem, ActivityLog,
  OrderStatus, ProductStatus, RestockPriority,
} from '../types';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electronics', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Clothing', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Grocery', createdAt: new Date().toISOString() },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p-1', name: 'iPhone 13', categoryId: 'cat-1', price: 999, stock: 3, minStockThreshold: 5, status: 'active', createdAt: new Date().toISOString() },
  { id: 'p-2', name: 'Headphones', categoryId: 'cat-1', price: 149, stock: 2, minStockThreshold: 5, status: 'active', createdAt: new Date().toISOString() },
  { id: 'p-3', name: 'T-Shirt', categoryId: 'cat-2', price: 25, stock: 20, minStockThreshold: 5, status: 'active', createdAt: new Date().toISOString() },
  { id: 'p-4', name: 'Rice 5kg', categoryId: 'cat-3', price: 12, stock: 50, minStockThreshold: 10, status: 'active', createdAt: new Date().toISOString() },
];

function calcPriority(stock: number, threshold: number): RestockPriority {
  const ratio = stock / threshold;
  if (ratio === 0) return 'high';
  if (ratio <= 0.5) return 'high';
  if (ratio <= 1) return 'medium';
  return 'low';
}

const SEED_RESTOCK: RestockItem[] = SEED_PRODUCTS
  .filter(p => p.stock < p.minStockThreshold)
  .map(p => ({
    productId: p.id,
    addedAt: new Date().toISOString(),
    priority: calcPriority(p.stock, p.minStockThreshold),
  }));

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1',
    customerName: 'Alice Johnson',
    items: [{ productId: 'p-3', quantity: 2, priceAtTime: 25 }],
    totalPrice: 50,
    status: 'delivered',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-2',
    customerName: 'Bob Smith',
    items: [{ productId: 'p-4', quantity: 3, priceAtTime: 12 }],
    totalPrice: 36,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const SEED_LOGS: ActivityLog[] = [
  { id: 'log-1', message: 'Order #ord-1 created by user', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log-2', message: 'Stock updated for "iPhone 13"', timestamp: new Date(Date.now() - 2400000).toISOString() },
  { id: 'log-3', message: 'Product "Headphones" added to Restock Queue', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'log-4', message: 'Order #ord-1 marked as Delivered', timestamp: new Date(Date.now() - 600000).toISOString() },
];

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  categories: Category[];
  products: Product[];
  orders: Order[];
  restockQueue: RestockItem[];
  activityLogs: ActivityLog[];
}

const initialState: AppState = {
  user: null,
  categories: SEED_CATEGORIES,
  products: SEED_PRODUCTS,
  orders: SEED_ORDERS,
  restockQueue: SEED_RESTOCK,
  activityLogs: SEED_LOGS,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
  | { type: 'RESTOCK_PRODUCT'; payload: { productId: string; quantity: number } }
  | { type: 'ADD_LOG'; payload: ActivityLog };

function addLog(logs: ActivityLog[], message: string): ActivityLog[] {
  const entry: ActivityLog = {
    id: `log-${Date.now()}`,
    message,
    timestamp: new Date().toISOString(),
  };
  return [entry, ...logs].slice(0, 10);
}

function syncRestockQueue(products: Product[], queue: RestockItem[]): RestockItem[] {
  const newQueue: RestockItem[] = [];
  for (const p of products) {
    if (p.stock < p.minStockThreshold) {
      const existing = queue.find(q => q.productId === p.id);
      newQueue.push(existing ?? {
        productId: p.id,
        addedAt: new Date().toISOString(),
        priority: calcPriority(p.stock, p.minStockThreshold),
      });
    }
  }
  return newQueue.sort((a, b) => {
    const pA = products.find(p => p.id === a.productId)!;
    const pB = products.find(p => p.id === b.productId)!;
    return pA.stock - pB.stock;
  });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'ADD_PRODUCT': {
      const products = [...state.products, action.payload];
      return {
        ...state,
        products,
        restockQueue: syncRestockQueue(products, state.restockQueue),
        activityLogs: addLog(state.activityLogs, `Product "${action.payload.name}" added`),
      };
    }

    case 'UPDATE_PRODUCT': {
      const products = state.products.map(p =>
        p.id === action.payload.id ? action.payload : p
      );
      return {
        ...state,
        products,
        restockQueue: syncRestockQueue(products, state.restockQueue),
        activityLogs: addLog(state.activityLogs, `Product "${action.payload.name}" updated`),
      };
    }

    case 'DELETE_PRODUCT': {
      const products = state.products.filter(p => p.id !== action.payload);
      return {
        ...state,
        products,
        restockQueue: syncRestockQueue(products, state.restockQueue),
      };
    }

    case 'ADD_ORDER': {
      const order = action.payload;
      let products = [...state.products];
      for (const item of order.items) {
        products = products.map(p => {
          if (p.id !== item.productId) return p;
          const newStock = p.stock - item.quantity;
          const status: ProductStatus = newStock <= 0 ? 'out_of_stock' : 'active';
          return { ...p, stock: Math.max(0, newStock), status };
        });
      }
      return {
        ...state,
        products,
        orders: [order, ...state.orders],
        restockQueue: syncRestockQueue(products, state.restockQueue),
        activityLogs: addLog(state.activityLogs, `Order #${order.id} created by user`),
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      const { id, status } = action.payload;
      let products = [...state.products];

      // Restore stock if cancelled
      if (status === 'cancelled') {
        const order = state.orders.find(o => o.id === id);
        if (order && order.status !== 'cancelled') {
          for (const item of order.items) {
            products = products.map(p => {
              if (p.id !== item.productId) return p;
              const newStock = p.stock + item.quantity;
              return { ...p, stock: newStock, status: 'active' as ProductStatus };
            });
          }
        }
      }

      const orders = state.orders.map(o =>
        o.id === id ? { ...o, status } : o
      );
      return {
        ...state,
        orders,
        products,
        restockQueue: syncRestockQueue(products, state.restockQueue),
        activityLogs: addLog(state.activityLogs, `Order #${id} marked as ${status}`),
      };
    }

    case 'RESTOCK_PRODUCT': {
      const { productId, quantity } = action.payload;
      const products = state.products.map(p => {
        if (p.id !== productId) return p;
        const newStock = p.stock + quantity;
        return { ...p, stock: newStock, status: 'active' as ProductStatus };
      });
      const product = products.find(p => p.id === productId);
      return {
        ...state,
        products,
        restockQueue: syncRestockQueue(products, state.restockQueue),
        activityLogs: addLog(state.activityLogs, `Stock updated for "${product?.name}"`),
      };
    }

    case 'ADD_LOG':
      return { ...state, activityLogs: addLog(state.activityLogs, action.payload.message) };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
