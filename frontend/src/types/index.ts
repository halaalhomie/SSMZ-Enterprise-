// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'employee';
export type TransactionType = 'stock_in' | 'stock_out' | 'adjustment';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  store_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  category?: Category;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  store_id: string;
  product_id: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
  user_id?: string;
  user?: Pick<User, 'id' | 'name'>;
  supplier_id?: string;
  supplier?: Pick<Supplier, 'id' | 'name'>;
  type: TransactionType;
  quantity: number;
  cost_per_unit?: number;
  invoice_number?: string;
  reason?: string;
  remarks?: string;
  created_at: string;
}

export interface StockAudit {
  id: string;
  store_id: string;
  product_id: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
  user_id?: string;
  user?: Pick<User, 'id' | 'name'>;
  db_quantity: number;
  physical_quantity: number;
  difference: number;
  notes?: string;
  created_at: string;
}

export interface Note {
  id: string;
  store_id: string;
  user_id?: string;
  user?: Pick<User, 'id' | 'name'>;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  extra_data: Record<string, unknown>;
  created_at: string;
  user?: Pick<User, 'id' | 'name'>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_products: number;
  total_inventory_value: number;
  low_stock_count: number;
  today_stock_in_transactions: number;
  today_stock_in_units: number;
  today_stock_out_transactions: number;
  today_stock_out_units: number;
  total_suppliers: number;
  total_categories: number;
}

export interface StockMovementPoint {
  date: string;
  stock_in: number;
  stock_out: number;
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  value: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  store_name: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Forms ───────────────────────────────────────────────────────────────────

export interface ProductForm {
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
}

export interface StockInForm {
  product_id: string;
  quantity: number;
  supplier_id?: string;
  invoice_number?: string;
  cost_per_unit?: number;
  remarks?: string;
}

export interface StockOutForm {
  product_id: string;
  quantity: number;
  reason?: string;
}

export interface AuditForm {
  product_id: string;
  physical_quantity: number;
  notes?: string;
}

// ─── WebSocket events ─────────────────────────────────────────────────────────

export interface WSMessage {
  event: 'stock_update' | 'low_stock_alert' | 'audit_complete' | 'notification' | 'product_created';
  data: Record<string, unknown>;
}
