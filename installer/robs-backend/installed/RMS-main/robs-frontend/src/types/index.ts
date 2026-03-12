// Type definitions for the restaurant system

export type UserRole = 'waiter' | 'admin' | 'kitchen' | 'manager' | 'delivery';

export type TableStatus = 'free' | 'occupied' | 'reserved';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string | null;
  reservedBy?: string | null;
  reservedTime?: string | null;
  groupId?: string | null;
  isPrimary?: boolean;
}

export interface MenuItemModifier {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  description: string;
  imageUrl?: string;
  available: boolean;
  preparationTime: number; // in minutes
  isVeg: boolean;
  availableFrom?: string;
  availableTo?: string;
  availabilityReason?: string;
  modifiers?: MenuItemModifier[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: OrderStatus;
  modifiers?: { id: string; name: string; price: number }[];
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  transactionId?: string;
  createdAt: string;
}

export interface DeliveryDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  driverId?: string;
  deliveryStatus: string;
  driver?: User;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  total: number;
  discount?: {
    type: 'percentage' | 'amount';
    value: number;
  };
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  holdStatus: boolean;
  cancelReason?: string;
  paymentTransactions?: PaymentTransaction[];
  deliveryDetails?: DeliveryDetails;
  previousPaidTotal?: number;
  previousOrders?: Order[];
}

export type NotificationType = 'order' | 'payment' | 'alert';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string; // Changed from timestamp to match backend
  read: boolean;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minLevel: number;
}

export interface Reservation {
  id: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'checked_in' | 'cancelled' | 'expired';
}

export interface Settings {
  taxRate: number;
  taxEnabled: boolean;
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
  enabledPaymentMethods: string[];
  receiptFooter: string;
  restaurantAddress?: string;
  gstNo?: string;
  notificationPreferences?: {
    orderNotifications: boolean;
    paymentNotifications: boolean;
    lowStockAlerts: boolean;
  };
  reservationGracePeriod: number;
}
