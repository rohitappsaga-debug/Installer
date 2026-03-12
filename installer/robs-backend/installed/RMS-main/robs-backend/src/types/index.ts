// Type definitions for the restaurant system backend
import { TableStatus, OrderStatus, PaymentMethod, NotificationType } from '@prisma/client';

export const UserRole = {
  waiter: 'waiter',
  admin: 'admin',
  kitchen: 'kitchen',
  manager: 'manager',
  delivery: 'delivery'
} as const;

export type UserRole = keyof typeof UserRole;

// Base types from Prisma
export { TableStatus, OrderStatus, PaymentMethod, NotificationType };

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for responses
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

// Table types
export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string | null;
  reservedBy?: string | null;
  reservedTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableRequest {
  number: number;
  capacity: number;
  status?: TableStatus;
}

export interface UpdateTableRequest {
  number?: number;
  capacity?: number;
  status?: TableStatus;
  reservedBy?: string | null;
  reservedTime?: string | null;
}

// Menu Item types
export interface MenuItemModifier {
  id: string;
  menuItemId: string;
  name: string;
  price: number; // Decimal to number
  available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  available: boolean;
  preparationTime: number;
  isVeg: boolean;
  availableFrom?: string | null;
  availableTo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  modifiers?: MenuItemModifier[];
}

export interface CreateMenuItemRequest {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  available?: boolean;
  preparationTime?: number;
  isVeg?: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  available?: boolean;
  preparationTime?: number;
  isVeg?: boolean;
  availableFrom?: string;
  availableTo?: string;
}

// Order types
export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  transactionId?: string | null;
  createdAt: Date;
}

export interface DeliveryDetails {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  driverId?: string | null;
  deliveryStatus: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdBy: string;
  total: number;
  discountType?: string | null;
  discountValue?: number | null;
  isPaid: boolean;
  paymentMethod?: PaymentMethod | null;
  holdStatus: boolean;
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
  paymentTransactions?: PaymentTransaction[];
  deliveryDetails?: DeliveryDetails | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  notes?: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  menuItem?: MenuItem;
}

export interface CreateOrderRequest {
  tableNumber: number;
  items: CreateOrderItemRequest[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  deliveryDetails?: {
    customerName: string;
    customerPhone: string;
    address: string;
  };
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  holdStatus?: boolean;
  cancelReason?: string;
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  notes?: string;
  status?: OrderStatus;
}

// Inventory Types
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  stock: number;
  minLevel: number;
}

export interface UpdateIngredientRequest {
  stock?: number;
  minLevel?: number;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  message: string;
  userId: string;
}

// Settings types
export interface Settings {
  id: string;
  taxRate: number;
  currency: string;
  restaurantName: string;
  discountPresets: number[];
  printerConfig: {
    enabled: boolean;
    printerName: string;
  };
  businessHours?: {
    open: string;
    close: string;
  };
  updatedAt: Date;
}

export interface UpdateSettingsRequest {
  taxRate?: number;
  currency?: string;
  restaurantName?: string;
  discountPresets?: number[];
  printerConfig?: {
    enabled: boolean;
    printerName: string;
  };
  businessHours?: {
    open: string;
    close: string;
  };
}

// Daily Sales types
export interface DailySales {
  id: string;
  date: Date;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface OrderQuery extends PaginationQuery {
  status?: OrderStatus;
  tableNumber?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface MenuQuery extends PaginationQuery {
  category?: string;
  available?: boolean;
  search?: string;
}

export interface TableQuery extends PaginationQuery {
  status?: TableStatus;
}

export interface NotificationQuery extends PaginationQuery {
  type?: NotificationType;
  read?: boolean;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Socket.io event types
export interface SocketEvents {
  'order:created': Order;
  'order:updated': Order;
  'order:status-changed': { orderId: string; status: OrderStatus };
  'table:status-changed': { tableId: string; status: TableStatus };
  'notification:new': Notification;
  'kitchen:item-ready': { orderId: string; itemId: string };
}

// Error types
export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Database connection types
export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  maxConnections?: number;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
