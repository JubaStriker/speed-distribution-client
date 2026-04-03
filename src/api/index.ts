import type {
  User, Category, Product, Order, OrderItem,
  RestockItem, ActivityLog, OrderStatus, ProductStatus, RestockStatus,
} from '../types';

// ─── ID Generator ──────────────────────────────────────────────────────────────

export function getId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'sd_jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Base request ──────────────────────────────────────────────────────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// ─── Normalizers ───────────────────────────────────────────────────────────────
// Handle both snake_case and camelCase server responses

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(u: Record<string, any>): User {
  return {
    id: String(u.id),
    email: u.email,
    firstName: u.firstName ??  '',
    lastName: u.lastName ??  '',
    role: u.role ?? 'manager',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCategory(c: Record<string, any>): Category {
  return {
    id: String(c.id),
    name: c.name,
    createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(p: Record<string, any>): Product {
  const stock = Number(p.stock ?? 0);
  return {
    id: String(p.id),
    name: p.name,
    categoryId: String(p.categoryId ?? p.category_id ?? ''),
    price: Number(p.price ?? 0),
    stock_quantity: p?.stock_quantity ?? 0,
    minStockThreshold: Number(p.minStockThreshold ?? p.min_stock_threshold ?? 5),
    status: (p.status as ProductStatus) ?? (stock === 0 ? 'out_of_stock' : 'active'),
    createdAt: p.createdAt ?? p.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrderItem(i: Record<string, any>): OrderItem {
  return {
    productId: String(i.productId ?? i.product_id ?? ''),
    productName: i.productName ?? i.product_name ?? undefined,
    quantity: Number(i.quantity ?? 1),
    priceAtTime: Number(i.priceAtTime ?? i.price_at_time ?? i.unit_price ?? i.price ?? 0),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(o: Record<string, any>): Order {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: OrderItem[] = Array.isArray(o.items) ? o.items.map((i: any) => normalizeOrderItem(i)) : [];
  return {
    id: String(o.id),
    orderId: o.order_id ?? o.orderId ?? undefined,
    customerName: o.customerName ?? o.customer_name ?? '',
    items,
    totalPrice: Number(o.totalPrice ?? o.total_price ?? 0),
    status: (o.status as OrderStatus) ?? 'pending',
    createdAt: o.createdAt ?? o.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRestockItem(r: Record<string, any>): RestockItem {
  return {
    restock_id: r.restock_id ?? r.restockId ?? getId('RES'),
    productId: String(r.product_id ?? r.productId ?? r.id),
    name: r.name ?? r.productName ?? r.product_name ?? '',
    addedAt: r.addedAt ?? r.added_at ?? r.createdAt ?? r.created_at ?? new Date().toISOString(),
    priority: ((r.priority as string)?.toLowerCase() ?? 'medium') as RestockItem['priority'],
    status: (r.status as RestockStatus) ?? 'pending',
    stock_quantity: Number(r.stock_quantity ?? 0),
    min_stock_threshold: Number(r.min_stock_threshold ?? r.minStockThreshold ?? 0),
    category_name: r.category_name ?? r.categoryName ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLog(l: Record<string, any>): ActivityLog {
  return {
    id: String(l.id),
    message: l.message ?? l.description ?? '',
    timestamp: l.timestamp ?? l.createdAt ?? l.created_at ?? new Date().toISOString(),
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<Record<string, any>>('POST', '/auth/login', { email, password });
    const payload = res.data ?? res;
    const token: string = payload.token ?? payload.access_token ?? payload.accessToken ?? '';
    const user: User = payload.user ? normalizeUser(payload.user) : normalizeUser(payload);
    return { token, user };
  },

  async signup(firstName: string, lastName: string, email: string, password: string): Promise<{ token?: string; user: User }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<Record<string, any>>('POST', '/auth/signup', { firstName, lastName, email, password });
    const payload = res.data ?? res;
    const token: string | undefined = payload.token ?? payload.access_token ?? payload.accessToken;
    const user: User = payload.user ? normalizeUser(payload.user) : normalizeUser(payload);
    return { token, user };
  },

  async me(): Promise<User> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<Record<string, any>>('GET', '/auth/me');
    const payload = res.data ?? res;
    return normalizeUser(payload.user ?? payload);
  },
};

// ─── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  async list(): Promise<Category[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<any>('GET', '/categories');
    const arr = Array.isArray(data) ? data : (data.categories ?? data.data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return arr.map((c: any) => normalizeCategory(c));
  },

  async create(name: string): Promise<Category> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('POST', '/categories', { name });
    return normalizeCategory(data.category ?? data);
  },

  async remove(id: string): Promise<void> {
    await request('DELETE', `/categories/${id}`);
  },
};

// ─── Products ──────────────────────────────────────────────────────────────────

export interface ProductQuery {
  q?: string;
  category_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: PaginationInfo;
}

export interface ProductInput {
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  status: ProductStatus;
}

export const productsApi = {
  async list(query?: ProductQuery): Promise<PaginatedProducts> {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.category_id) params.set('category_id', query.category_id);
    if (query?.status) params.set('status', query.status);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>('GET', `/products${qs}`);
    const arr = Array.isArray(res) ? res : (res.products ?? res.data ?? []);
    const pagination: PaginationInfo = res.pagination ?? {
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
      total: arr.length,
      total_pages: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: arr.map((p: any) => normalizeProduct(p)), pagination };
  },

  async create(input: ProductInput): Promise<Product> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('POST', '/products', input);
    return normalizeProduct(data.product ?? data);
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('PUT', `/products/${id}`, input);
    return normalizeProduct(data.product ?? data);
  },

  async remove(id: string): Promise<void> {
    await request('DELETE', `/products/${id}`);
  },
};

// ─── Orders ────────────────────────────────────────────────────────────────────

export interface OrderQuery {
  status?: string;
  today?: boolean;
  page?: number;
  limit?: number;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface PaginatedOrders {
  data: Order[];
  pagination: PaginationInfo;
}

export const ordersApi = {
  async list(query?: OrderQuery): Promise<PaginatedOrders> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.today) params.set('today', 'true');
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>('GET', `/orders${qs}`);
    const arr = Array.isArray(res) ? res : (res.orders ?? res.data ?? []);
    const pagination: PaginationInfo = res.pagination ?? {
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
      total: arr.length,
      total_pages: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: arr.map((o: any) => normalizeOrder(o)), pagination };
  },

  async get(id: string): Promise<Order> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('GET', `/orders/${id}`);
    return normalizeOrder(data.order ?? data);
  },

  async create(customerName: string, items: OrderItemInput[]): Promise<Order> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('POST', '/orders', {
      customer_name: customerName,
      items,
    });
    return normalizeOrder(data.order ?? data.data ?? data);
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('PUT', `/orders/${id}/status`, { status });
    return normalizeOrder(data.order ?? data);
  },

  async cancel(id: string): Promise<void> {
    await request('DELETE', `/orders/${id}`);
  },
};

// ─── Restock ───────────────────────────────────────────────────────────────────

export const restockApi = {
  async list(): Promise<RestockItem[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<any>('GET', '/restock');
    const arr = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return arr.map((r: any) => normalizeRestockItem(r));
  },

  async restock(productId: string, quantity: number): Promise<Product> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('PUT', `/restock/${productId}/restock`, { quantity_to_add: quantity });
    return normalizeProduct(data.product ?? data);
  },

  async updateStatus(restockId: string, status: RestockStatus): Promise<RestockItem> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<Record<string, any>>('PUT', `/restock/${restockId}/status`, { status });
    return normalizeRestockItem(data.restockItem ?? data.restock_item ?? data);
  },
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  todayOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  todayRevenue: number;
  lowStockCount: number;
  totalOrders: number;
}

export const dashboardApi = {
  async get(): Promise<DashboardMetrics> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await request<Record<string, any>>('GET', '/dashboard');
    return {
      totalOrders: d.totalOrders ?? d.total_orders ?? d.orders?.total ?? 0,
      todayOrders: d.todayOrders ?? d.today_orders ?? d.orders?.today ?? 0,
      pendingOrders: d.pendingOrders ?? d.pending_orders ?? d.orders?.pending ?? 0,
      deliveredOrders: d.deliveredOrders ?? d.delivered_orders ?? d.orders?.delivered ?? 0,
      todayRevenue: d.todayRevenue ?? d.today_revenue ?? d.revenue?.today ?? 0,
      lowStockCount: d.lowStockCount ?? d.low_stock_count ?? d.stock?.low_count ?? 0,
    };
  },
};

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  total_orders_today: number;
  pending_orders_today: number;
  low_stock_count: number;
  revenue_today: number;
  orders_by_status: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  latest_orders: Order[];
}

export const analyticsApi = {
  async get(): Promise<AnalyticsData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<Record<string, any>>('GET', '/analytics');
    const d = res.data ?? res;
    return {
      total_orders_today: Number(d.total_orders_today ?? 0),
      pending_orders_today: Number(d.pending_orders_today ?? 0),
      low_stock_count: Number(d.low_stock_count ?? 0),
      revenue_today: Number(d.revenue_today ?? 0),
      orders_by_status: d.orders_by_status ?? {
        pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latest_orders: Array.isArray(d.latest_orders) ? d.latest_orders.map((o: any) => normalizeOrder(o)) : [],
    };
  },
};

// ─── Activity Log ──────────────────────────────────────────────────────────────

export const activityApi = {
  async list(): Promise<ActivityLog[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<any>('GET', '/activity-log');
    const arr = Array.isArray(data) ? data : (data.logs ?? data.activities ?? data.data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return arr.map((l: any) => normalizeLog(l));
  },
};
