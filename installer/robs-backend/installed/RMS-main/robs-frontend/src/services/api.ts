import api from '../utils/api';
import { User, Table, MenuItem, Order, OrderItem, Notification, Settings, DailySales, UserRole, TableStatus, OrderStatus, PaymentMethod, NotificationType } from '../types';

// Auth API
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: { name: string; email: string; password: string; role: UserRole }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: string, userData: Partial<{ name: string; email: string; password: string; role: UserRole; active: boolean }>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },
};

// Tables API
export const tablesAPI = {
  getAll: async (page = 1, limit = 10, status?: TableStatus) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const response = await api.get(`/tables?${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },

  create: async (tableData: { number: number; capacity: number; status?: TableStatus }) => {
    const response = await api.post('/tables', tableData);
    return response.data;
  },

  bulkCreate: async (tables: Array<{ number: number; capacity: number; status?: TableStatus }>) => {
    const response = await api.post('/tables/bulk', { tables });
    return response.data;
  },

  update: async (id: string, tableData: Partial<{ number: number; capacity: number; status: TableStatus; reservedBy: string | null; reservedTime: string | null; currentOrderId: string | null }>) => {
    const response = await api.put(`/tables/${id}`, tableData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: TableStatus) => {
    const response = await api.patch(`/tables/${id}/status`, { status });
    return response.data;
  },
};

// Menu API
export const menuAPI = {
  getAll: async (page = 1, limit = 10, category?: string, available?: boolean, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (category) params.append('category', category);
    if (available !== undefined) params.append('available', available.toString());
    if (search) params.append('search', search);
    const response = await api.get(`/menu?${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/menu/categories/list');
    return response.data;
  },

  create: async (menuData: { name: string; category: string; price: number; description?: string; imageUrl?: string; available?: boolean; preparationTime?: number; availabilityReason?: string }) => {
    const response = await api.post('/menu', menuData);
    return response.data;
  },

  update: async (id: string, menuData: Partial<{ name: string; category: string; price: number; description: string; imageUrl: string; available: boolean; preparationTime: number; availabilityReason: string }>) => {
    const response = await api.put(`/menu/${id}`, menuData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },

  toggleAvailability: async (id: string) => {
    const response = await api.patch(`/menu/${id}/availability`);
    return response.data;
  },

  addModifier: async (id: string, modifierData: { name: string; price: number; available: boolean }) => {
    const response = await api.post(`/menu/${id}/modifiers`, modifierData);
    return response.data;
  },

  removeModifier: async (modifierId: string) => {
    const response = await api.delete(`/menu/modifiers/${modifierId}`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async (page = 1, limit = 10, status?: OrderStatus, tableNumber?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (tableNumber) params.append('tableNumber', tableNumber.toString());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const response = await api.get(`/orders?${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getByTable: async (tableNumber: number) => {
    const response = await api.get(`/orders/table/${tableNumber}`);
    return response.data;
  },

  create: async (orderData: {
    tableNumber?: number | null;
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
    discountType?: 'percentage' | 'amount';
    discountValue?: number;
    deliveryDetails?: { customerName: string; customerPhone: string; address: string };
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  update: async (id: string, orderData: Partial<{ status: OrderStatus; discountType: 'percentage' | 'amount'; discountValue: number; isPaid: boolean; paymentMethod: PaymentMethod }>) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  updateItemStatus: async (orderId: string, itemId: string, status: OrderStatus) => {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
    return response.data;
  },

  addItems: async (orderId: string, items: Array<{ menuItemId: string; quantity: number; notes?: string }>) => {
    const response = await api.post<{ success: boolean; data: Order; message?: string }>(`/orders/${orderId}/items`, { items });
    return response.data;
  },

  removeItem: async (orderId: string, itemId: string) => {
    const response = await api.delete<{ success: boolean; data: Order; message?: string }>(`/orders/${orderId}/items/${itemId}`);
    return response.data;
  },

  updateItem: async (orderId: string, itemId: string, data: { quantity?: number; notes?: string }) => {
    const response = await api.put<{ success: boolean; data: Order; message?: string }>(`/orders/${orderId}/items/${itemId}`, data);
    return response.data;
  },

  split: async (items: Array<{ itemId: string; quantity: number }>, targetTableNumber: number) => {
    const response = await api.post('/orders/split', { items, targetTableNumber });
    return response.data;
  },

  merge: async (sourceTableNumber: number, targetTableNumber: number) => {
    const response = await api.post('/orders/merge', { sourceTableNumber, targetTableNumber });
    return response.data;
  },

  hold: async (id: string, hold: boolean) => {
    const response = await api.post(`/orders/${id}/hold`, { hold });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (page = 1, limit = 10, type?: NotificationType, read?: boolean) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    if (read !== undefined) params.append('read', read.toString());
    const response = await api.get(`/notifications?${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  create: async (notificationData: { type: NotificationType; message: string; userId: string }) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  update: async (settingsData: Partial<Settings>) => {
    const response = await api.put('/settings', settingsData);
    return response.data;
  },

  getTax: async () => {
    const response = await api.get('/settings/tax');
    return response.data;
  },

  updateTax: async (taxRate: number, currency?: string) => {
    const response = await api.patch('/settings/tax', { taxRate, currency });
    return response.data;
  },

  getSystemInfo: async () => {
    const response = await api.get('/settings/system');
    return response.data;
  },

  getHealth: async () => {
    try {
      // Use axios directly to call the base health endpoint without /api prefix if needed
      // Actually, since baseURL is .../api, and health is at /, we can use a relative path
      const response = await api.get('/../../health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false };
    }
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  create: async (data: { name: string; description?: string; isActive?: boolean }) => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  bulkCreate: async (categories: Array<{ name: string; description?: string; isActive?: boolean }>) => {
    const response = await api.post('/categories/bulk', { categories });
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};



// Payments API
export const paymentsAPI = {
  payOrder: async (orderId: string, paymentData: { amount: number; method: PaymentMethod; transactionId?: string }) => {
    const response = await api.post(`/payments/${orderId}/pay`, paymentData);
    return response.data;
  },

  refundTransaction: async (transactionId: string) => {
    const response = await api.post(`/payments/${transactionId}/refund`);
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getDailySales: async (days: number = 7, previousDays: number = 7) => {
    const response = await api.get(`/reports/daily?limit=${days}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  },

  getTopItems: async (limit: number = 10, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/top-items?${params}`);
    return response.data;
  },

  getRange: async (startDate: string, endDate: string) => {
    const response = await api.get(`/reports/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
};

// Inventory API
export const inventoryAPI = {
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  adjustStock: async (id: string, data: any) => {
    const response = await api.post(`/inventory/${id}/adjust`, data);
    return response.data;
  }
};

// Suppliers API
export const suppliersAPI = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  }
};
