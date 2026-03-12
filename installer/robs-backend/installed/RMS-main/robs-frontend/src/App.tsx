import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Table, MenuItem, Order, User, Notification, OrderItem, PaymentMethod, OrderStatus } from './types';
import { mockTables, mockMenuItems, mockOrders, mockUsers, mockNotifications, mockSettings } from './data/mockData';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { tablesAPI, menuAPI, ordersAPI, notificationsAPI, settingsAPI, usersAPI, paymentsAPI } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { useRealtime } from './contexts/RealtimeContext';

// Mobile Components
import { MobileLogin } from './components/mobile/MobileLogin';
import { TableSelection } from './components/mobile/TableSelection';
import { MenuScreen } from './components/mobile/MenuScreen';
import { OrderSummary } from './components/mobile/OrderSummary';
import { BillScreen } from './components/mobile/BillScreen';
import { NotificationsPanel } from './components/mobile/NotificationsPanel';
import { ProfileScreen } from './components/mobile/ProfileScreen';
import { MobileLayout } from './components/MobileLayout';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TableManagement } from './components/admin/TableManagement';
import { MenuManagement } from './components/admin/MenuManagement';
import { CategoryManagement } from './components/admin/CategoryManagement';
import { UserManagement } from './components/admin/UserManagement';
import { BillingConsole } from './components/admin/BillingConsole';
import { SettingsPanel } from './components/admin/SettingsPanel';
import { OrdersPage } from './components/admin/Orders';
import { SalesReports } from './components/admin/SalesReports';
import { AdminLayout } from './components/AdminLayout';

// Kitchen Components
import { KitchenLogin } from './components/kitchen/KitchenLogin';
import { KitchenDisplay } from './components/kitchen/KitchenDisplay';

// Print Component
import { PosReceipt } from './components/PosReceipt';

import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { ConfirmProvider, useConfirm } from './components/ui/confirm-dialog-provider';

type AppMode = 'selection' | 'mobile' | 'admin' | 'kitchen';
type MobilePage = 'login' | 'tables' | 'menu' | 'order' | 'bill' | 'notifications' | 'profile';
type AdminPage = 'login' | 'dashboard' | 'tables' | 'menu' | 'categories' | 'users' | 'billing' | 'settings';
type KitchenPage = 'login' | 'display';

// Main App Component with API Integration
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();
  const { user, login, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { orders, tables: realtimeTables, notifications, menuItems, updateOrder, updateTable, updateMenuItem, addNotification, markNotificationAsRead, deleteNotification, clearAllNotifications: clearAllContextNotifications, isConnected, setAllOrders, setAllTables, setAllMenuItems, setAllNotifications, addOrder } = useRealtime();

  // Data state - using real-time data when available, fallback to mock data
  const [tables, setTables] = useState<Table[]>(mockTables);
  // orders state removed - using RealtimeContext as single source of truth
  // notifications state removed - using RealtimeContext as single source of truth
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [settings, setSettings] = useState(mockSettings);
  const [categories, setCategories] = useState<string[]>(['All', 'Pizza', 'Burgers', 'Pasta', 'Mains', 'Salads', 'Desserts', 'Beverages']); // Initial categories fallback
  const [isLoading, setIsLoading] = useState(false);
  const [isServerUp, setIsServerUp] = useState(false);

  // Mobile specific state
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Load data from API when authenticated
  useEffect(() => {
    // Check server health on mount and periodically
    const checkHealth = async () => {
      try {
        const response = await settingsAPI.getHealth();
        setIsServerUp(response.status === 'healthy' || response.success);
      } catch {
        setIsServerUp(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    if (isAuthenticated && user) {
      loadInitialData();
    }

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, user?.role]);

  // Restore app state based on user role
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      if (location.pathname === '/' || location.pathname === '/login') {
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === 'waiter') {
          navigate('/waiter/tables', { replace: true });
        } else if (user.role === 'kitchen') {
          navigate('/kitchen/display', { replace: true });
        }
      }
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, location.pathname]);


  // Use real-time data when available
  useEffect(() => {
    if (realtimeTables.length > 0) {
      setTables(realtimeTables);
    }
  }, [realtimeTables]);

  // Sync effect removed - direct consumption of context


  // Sync effect removed - direct consumption of context to prevent overwriting
  // useEffect(() => {
  //   if (realtimeNotifications.length > 0) {
  //     setNotifications(realtimeNotifications);
  //   }
  // }, [realtimeNotifications]);

  // Sync currentOrder with global orders (real-time updates)
  useEffect(() => {
    if (currentOrder && orders.length > 0) {
      const updated = orders.find(o => o.id === currentOrder.id);
      if (updated && updated !== currentOrder) {
        setCurrentOrder(updated);
      }
    }
  }, [orders, currentOrder]);

  const loadInitialData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      // Load tables
      try {
        const tablesResponse = await tablesAPI.getAll(1, 100);
        if (tablesResponse.success) {
          setAllTables(tablesResponse.data); // Hydrate realtime context
          setTables(tablesResponse.data); // Keep local fallback state sync
        }
      } catch (e) {
        console.error('Failed to load tables:', e);
      }

      // Load menu items
      try {
        const menuResponse = await menuAPI.getAll(1, 100);
        if (menuResponse.success) {
          setAllMenuItems(menuResponse.data);
        }
      } catch (e) {
        console.error('Failed to load menu items:', e);
      }

      // Load orders
      try {
        const ordersResponse = await ordersAPI.getAll(1, 100);
        if (ordersResponse.success) {
          setAllOrders(ordersResponse.data); // Hydrate realtime context - Single Source of Truth
        }
      } catch (e) {
        console.error('Failed to load orders:', e);
      }

      // Load items that everyone needs
      const [settingsResponse, categoriesResponse, notificationsResponse] = await Promise.all([
        settingsAPI.get(),
        menuAPI.getCategories(),
        notificationsAPI.getAll(1, 100)
      ]);

      if (settingsResponse.success) setSettings(settingsResponse.data);
      if (categoriesResponse.success) setCategories(['All', ...categoriesResponse.data]);
      if (notificationsResponse.success) {
        setAllNotifications(notificationsResponse.data);
      }


      // Load admin-specific data
      if (user && user.role === 'admin') {
        // Load users
        const usersResponse = await usersAPI.getAll(1, 100);
        if (usersResponse.success) {
          setUsers(usersResponse.data);
        }
      }

    } catch (error: any) {
      console.error('Error loading initial data:', error);
      const url = error?.config?.url || 'unknown endpoint';
      toast.error(`Data load error: ${url}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, setAllOrders, setAllTables, setAllMenuItems]);

  // Retry loading data when server comes back online or socket connects
  useEffect(() => {
    if (isAuthenticated && user && (isServerUp || isConnected)) {
      loadInitialData(true);
    }
  }, [isServerUp, isConnected, isAuthenticated, user, loadInitialData]);


  // Print bill function
  const handlePrintBill = (orderOrId: string | Order) => {
    let order: Order | undefined;

    if (typeof orderOrId === 'string') {
      order = orders.find(o => o.id === orderOrId);
      // Fallback to currentOrder if it matches the ID
      if (!order && currentOrder?.id === orderOrId) {
        order = currentOrder;
      }
    } else {
      order = orderOrId;
    }

    if (!order) {
      toast.error('Order not found');
      return;
    }

    // Create a temporary container for the bill
    const printContainer = document.createElement('div');
    printContainer.id = 'print-root';
    document.body.appendChild(printContainer);

    // Render the printable bill
    // Render the printable bill
    const root = createRoot(printContainer);
    root.render(
      <PosReceipt
        order={order}
        currency={settings.currency}
        taxRate={settings.taxRate}
        taxEnabled={settings.taxEnabled}
        restaurantName={settings.restaurantName}
        restaurantAddress={settings.restaurantAddress}
        gstNo={settings.gstNo}
        footerMessage={settings.receiptFooter}
        autoPrint={true}
      />
    );

    // Wait for rendering to complete and print (handled by component)
    // Cleanup after a delay to ensure print dialog is handled
    setTimeout(() => {
      root.unmount();
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    }, 2000); // Give enough time for the component's auto-print to trigger and dialog to open

    toast.success('Opening print dialog...');
  };

  // Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Order Creation Handler
  const handleCreateOrder = async (items: OrderItem[], discount?: { type: 'percentage' | 'amount', value: number }) => {
    if (!selectedTable) return;

    // CHECK FOR EXISTING ORDER UPDATE
    if (currentOrder) {

      try {
        const added = await ordersAPI.addItems(currentOrder.id, items.map(i => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes
        })));



        if (added.success) {
          const updatedOrder = added.data as Order;
          updateOrder(updatedOrder);
          setCurrentOrder(updatedOrder);
          navigate('/waiter/bill');
          toast.success('Items added to order!');
        } else {
          console.error('Add items failed:', added);
          toast.error(added.message || 'Failed to add items');
        }
      } catch (e: any) {
        console.error('Add items error:', e);
        const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to add items';
        toast.error(msg);
      }
      return;
    }

    // CREATE NEW ORDER
    try {
      const created = await ordersAPI.create({
        tableNumber: selectedTable.number,
        items: items.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, notes: i.notes })),
        discountType: discount?.type,
        discountValue: discount?.value,
      });

      if (created.success) {
        const orderFromApi = created.data as Order;
        addOrder(orderFromApi);
        setCurrentOrder(orderFromApi);
        // Refresh tables to reflect occupied state
        try {
          const tablesResp = await tablesAPI.getAll(1, 100);
          if (tablesResp.success) setTables(tablesResp.data);
        } catch { }
        navigate('/waiter/bill');
        toast.success('Order sent to kitchen!');
      } else {
        toast.error('Failed to create order');
      }
    } catch (e: any) {
      console.error('Create order error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to create order';
      toast.error(msg);
    }
  };



  const handleRemoveItemFromOrder = async (itemId: string) => {
    if (!currentOrder) return;

    if (!await confirm({
      title: 'Remove Item',
      description: 'Are you sure you want to remove this item? This action cannot be undone.',
      confirmText: 'Remove',
      variant: 'destructive',
    })) return;

    try {
      const result = await ordersAPI.removeItem(currentOrder.id, itemId);
      if (result.success) {
        const updatedOrder = result.data as Order;
        updateOrder(updatedOrder);
        setCurrentOrder(updatedOrder);
        toast.success('Item removed');
      } else {
        toast.error('Failed to remove item');
      }
    } catch (e: any) {
      console.error('Remove item error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to remove item';
      toast.error(msg);
    }
  };

  // Payment Handler
  const handleMarkAsPaid = async (orderId?: string, paymentMethod?: string, amount?: number) => {
    const targetOrderId = orderId || currentOrder?.id;
    if (!targetOrderId) return;

    try {
      let success = false;
      let updatedOrder: Order | null = null;

      if (amount !== undefined && paymentMethod) {
        // Full payment transaction flow
        const resp = await paymentsAPI.payOrder(targetOrderId, {
          amount,
          method: paymentMethod as PaymentMethod,
        });
        if (resp.success) {
          success = true;
          updatedOrder = resp.data.order;
        }
      } else {
        // Direct mark as paid
        const updated = await ordersAPI.update(targetOrderId, {
          isPaid: true,
          paymentMethod: (paymentMethod || 'cash') as PaymentMethod
        });
        if (updated.success) {
          success = true;
          updatedOrder = updated.data as Order;
        }
      }

      if (success && updatedOrder) {
        updateOrder(updatedOrder);
        if (currentOrder?.id === targetOrderId) {
          setCurrentOrder(updatedOrder);
        }
        // Refresh tables to reflect freed state
        try {
          const tablesResp = await tablesAPI.getAll(1, 100);
          if (tablesResp.success) setTables(tablesResp.data);
        } catch { }
        toast.success('Payment recorded successfully!');
      } else {
        toast.error('Failed to record payment');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to record payment');
    }
  };

  // Notification Handler
  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const resp = await notificationsAPI.markAsRead(id);
      if (resp.success) {
        // Update context optimistically or via re-fetch
        markNotificationAsRead(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!await confirm({
      title: 'Clear Notifications',
      description: 'Are you sure you want to clear all notifications? This cannot be undone.',
      confirmText: 'Clear All',
      variant: 'destructive'
    })) return;

    try {
      // Assuming a clear-all endpoint or just looping (less efficient but works for now if API missing)
      // Actually notificationsAPI has markAllAsRead, but not clearAll (delete all).
      // Let's just mark all read for now if delete all is not supported, 
      // OR just clear from UI if user wants "gone from screen".
      // But typically "Clear All" means delete.
      // Let's implement client-side clear for now + mark all read to be safe, 
      // or if we really want to delete, we need an endpoint.
      // For now: Mark all as read AND clear from UI context.

      const resp = await notificationsAPI.markAllAsRead(); // Logic gap: backend doesn't have deleteAll
      if (resp.success) {
        clearAllContextNotifications(); // Optimistic clear
        toast.success('Notifications cleared');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear notifications');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const resp = await notificationsAPI.delete(id);
      if (resp.success) {
        deleteNotification(id); // Optimistic update
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete notification');
    }
  };

  // Table Management Handlers
  const handleAddTable = async (table: Table) => {
    try {
      const created = await tablesAPI.create({ number: table.number, capacity: table.capacity, status: table.status });
      if (created.success) {
        const resp = await tablesAPI.getAll(1, 100);
        if (resp.success) setTables(resp.data);
        toast.success('Table added successfully');
      } else {
        toast.error(created.message || 'Failed to add table');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to add table';
      toast.error(msg);
    }
  };

  const handleBulkAddTables = async (tables: Array<Omit<Table, 'id'>>) => {
    try {
      const result = await tablesAPI.bulkCreate(tables as any);
      if (result.success) {
        const resp = await tablesAPI.getAll(1, 100);
        if (resp.success) setTables(resp.data);
        toast.success(`${result.data.count} tables added successfully`);
      } else {
        toast.error('Failed to add tables');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to add tables');
    }
  };

  const handleUpdateTable = async (id: string, updates: Partial<Table>) => {
    try {
      const updated = await tablesAPI.update(id, updates);
      if (updated.success) {
        const resp = await tablesAPI.getAll(1, 100);
        if (resp.success) setTables(resp.data);
        toast.success('Table updated');
      } else {
        toast.error(updated.message || 'Failed to update table');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to update table';
      toast.error(msg);
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      const deleted = await tablesAPI.delete(id);
      if (deleted.success) {
        const resp = await tablesAPI.getAll(1, 100);
        if (resp.success) setTables(resp.data);
        toast.success('Table deleted');
      } else {
        toast.error(deleted.message || 'Failed to delete table');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to delete table';
      toast.error(msg);
    }
  };

  // Menu Management Handlers
  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const created = await menuAPI.create({
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description,
        available: item.available,
        preparationTime: item.preparationTime,
        availabilityReason: item.availabilityReason,
      });
      if (created.success) {
        const resp = await menuAPI.getAll(1, 100);
        if (resp.success) setAllMenuItems(resp.data);
        toast.success('Menu item added');
      } else {
        toast.error(created.message || 'Failed to add menu item');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to add menu item';
      toast.error(msg);
    }
  };

  const handleUpdateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const updated = await menuAPI.update(id, updates);
      if (updated.success) {
        const resp = await menuAPI.getAll(1, 100);
        if (resp.success) setAllMenuItems(resp.data);
        toast.success('Menu item updated');
      } else {
        toast.error(updated.message || 'Failed to update menu item');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to update menu item';
      toast.error(msg);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      const deleted = await menuAPI.delete(id);
      if (deleted.success) {
        const resp = await menuAPI.getAll(1, 100);
        if (resp.success) setAllMenuItems(resp.data);
        toast.success('Menu item deleted');
      } else {
        toast.error(deleted.message || 'Failed to delete menu item');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to delete menu item';
      toast.error(msg);
    }
  };

  // User Management Handlers
  const handleAddUser = async (user: Omit<User, 'id'>) => {
    try {
      const created = await usersAPI.create({ name: user.name, email: user.email, password: (user as any).password || '', role: user.role });
      if (created.success) {
        const resp = await usersAPI.getAll(1, 100);
        if (resp.success) setUsers(resp.data);
        toast.success('User added successfully');
      } else {
        toast.error(created.message || 'Failed to add user');
      }
    } catch (e: any) {
      console.error('Add user error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to add user';
      toast.error(msg);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updated = await usersAPI.update(id, updates);
      if (updated.success) {
        const resp = await usersAPI.getAll(1, 100);
        if (resp.success) setUsers(resp.data);
        toast.success('User updated');
      } else {
        toast.error(updated.message || 'Failed to update user');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to update user';
      toast.error(msg);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const deleted = await usersAPI.delete(id);
      if (deleted.success) {
        const resp = await usersAPI.getAll(1, 100);
        if (resp.success) setUsers(resp.data);
        toast.success('User deleted');
      } else {
        toast.error(deleted.message || 'Failed to delete user');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to delete user';
      toast.error(msg);
    }
  };

  // Settings Handler
  const handleSaveSettings = async (newSettings: any) => {
    try {
      const updated = await settingsAPI.update(newSettings);
      if (updated.success) {
        const resp = await settingsAPI.get();
        if (resp.success) setSettings(resp.data);
        toast.success('Settings saved successfully');
      } else {
        toast.error(updated.message || 'Failed to save settings');
      }
    } catch (e: any) {
      console.error('Settings save error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save settings';
      toast.error(msg);
    }
  };

  // Kitchen Handler
  const handleKitchenStatusUpdate = async (orderId: string, itemId: string, status: OrderStatus) => {
    try {
      const nextStatus: OrderStatus = status;
      // Use the new item-level update API
      const updated = await ordersAPI.updateItemStatus(orderId, itemId, nextStatus);
      if (updated.success) {
        // Handle both direct and nested response for robustness
        const updatedOrder = (updated.data?.finalOrder || updated.data) as Order;
        if (updatedOrder && updatedOrder.id) {
          updateOrder(updatedOrder);
        }

        // Force refresh all orders to ensure UI sync
        const allOrders = await ordersAPI.getAll(1, 100);
        if (allOrders.success) setAllOrders(allOrders.data);
        toast.success(`Item marked as ${status}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (e: any) {
      console.error('Kitchen update error:', e);
      toast.error('Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      const updated = await ordersAPI.updateStatus(orderId, 'cancelled');
      if (updated.success) {
        const updatedOrder = updated.data as Order;
        updateOrder(updatedOrder);

        // Refresh tables since cancelling an order from kitchen should free the table
        const tablesResp = await tablesAPI.getAll(1, 100);
        if (tablesResp.success) {
          setTables(tablesResp.data);
          setAllTables(tablesResp.data);
        }

        // Force refresh all orders to ensure UI sync
        const allOrders = await ordersAPI.getAll(1, 100);
        if (allOrders.success) setAllOrders(allOrders.data);

        toast.success('Order cancelled successfully');
      } else {
        toast.error(updated.message || 'Failed to cancel order');
      }
    } catch (e: any) {
      console.error('Cancel order error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to cancel order';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissOrder = async (orderId: string) => {
    try {
      const updated = await ordersAPI.updateStatus(orderId, 'delivered');
      if (updated.success) {
        const updatedOrder = updated.data as Order;
        updateOrder(updatedOrder);

        // Force refresh all orders to ensure UI sync
        const allOrders = await ordersAPI.getAll(1, 100);
        if (allOrders.success) setAllOrders(allOrders.data);

        toast.success('Order cleared from kitchen');
      } else {
        toast.error(updated.message || 'Failed to clear order');
      }
    } catch (e: any) {
      console.error('Dismiss order error:', e);
      toast.error('Failed to clear order');
    }
  };

  return (
    <div className="min-h-screen bg-background no-print">
      <Routes>
        {/* Selection Screen */}
        <Route path="/" element={
          <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden bg-background">
            {/* Guaranteed Background Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1920&auto=format&fit=crop"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                loading="eager"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />

              {/* Decorative Gradients */}
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[100px]" />
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const root = document.documentElement;
                  if (root.classList.contains('dark')) {
                    root.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  } else {
                    root.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  }
                }}
                className="rounded-full w-12 h-12 bg-card/50 backdrop-blur-md shadow-sm border border-border hover:bg-card transition-all"
              >
                <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
                <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                <span className="sr-only">Toggle theme</span>
              </Button>


            </div>

            <div className="w-full max-w-5xl z-10">
              <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">
                  {settings.restaurantName || 'Restaurant Management System'}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Welcome back. Please select your role to access the workspace.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className={`flex h-3 w-3 rounded-full ${isConnected || isServerUp ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {isConnected || isServerUp ? 'System Operational' : 'Connecting to Server...'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Waiter Card */}
                <button
                  onClick={() => navigate('/waiter/login')}
                  className="group relative p-8 bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 group-hover:to-orange-500/10 transition-all duration-500" />
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">👨‍💼</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Waiter / Staff</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Table management, order taking, and bill processing for service staff.
                  </p>
                  <div className="mt-6 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    Access Portal →
                  </div>
                </button>

                {/* Admin Card */}
                <button
                  onClick={() => navigate('/admin/login')}
                  className="group relative p-8 bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 shadow-xl hover:shadow-2xl hover:border-purple-500/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 group-hover:to-purple-500/10 transition-all duration-500" />
                  <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">👔</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors">Admin / Manager</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Full system control, menu management, analytics, and staff settings.
                  </p>
                  <div className="mt-6 flex items-center text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    Access Dashboard →
                  </div>
                </button>

                {/* Kitchen Card */}
                <button
                  onClick={() => navigate('/kitchen/login')}
                  className="group relative p-8 bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 shadow-xl hover:shadow-2xl hover:border-green-500/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/5 group-hover:to-green-500/10 transition-all duration-500" />
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">👨‍🍳</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-green-500 transition-colors">Kitchen Staff</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Real-time order display, status updates, and cooking queue management.
                  </p>
                  <div className="mt-6 flex items-center text-green-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    Access KDS →
                  </div>
                </button>
              </div>
            </div>
          </div>
        } />

        {/* Waiter Flow */}
        <Route path="/waiter/*" element={
          <Routes>
            <Route path="login" element={
              <>
                <MobileLogin
                  restaurantName={settings.restaurantName}
                  onLogin={async (email, password, role) => {
                    try {
                      const userData = await login(email, password, role);
                      if (userData) {
                        navigate('/waiter/tables');
                        toast.success(`Welcome back, ${userData.name}!`);
                      }
                    } catch (error: any) {
                      console.log('[DEBUG] Waiter login error caught');
                      setTimeout(() => toast.error('Invalid email or password'), 0);
                    }
                  }}
                />
                <div className="fixed bottom-4 left-4 z-50">
                  <Button variant="outline" onClick={() => navigate('/')} className="bg-background/80 backdrop-blur-sm">
                    ← Back to Selection
                  </Button>
                </div>
              </>
            } />
            <Route path="tables" element={
              isAuthenticated ? (
                <MobileLayout
                  currentPage="tables"
                  onNavigate={(p) => navigate(`/waiter/${p}`)}
                  unreadNotifications={notifications.filter(n => !n.read).length}
                  restaurantName={settings.restaurantName}
                >
                  <TableSelection
                    tables={tables}
                    orders={orders}
                    onSelectTable={(table) => {
                      setSelectedTable(table);
                      setCurrentOrderItems([]);
                      setCurrentOrder(null);
                      if (table.status === 'occupied' && table.currentOrderId) {
                        const existingOrder = orders.find(o => o.id === table.currentOrderId);
                        if (existingOrder) {
                          setCurrentOrder(existingOrder);
                          navigate('/waiter/bill');
                        } else {
                          navigate('/waiter/menu');
                        }
                      } else {
                        navigate('/waiter/menu');
                      }
                    }}
                    onRefresh={() => { loadInitialData(true); }}
                  />
                </MobileLayout>
              ) : <Navigate to="/waiter/login" replace />
            } />
            <Route path="menu" element={
              isAuthenticated && selectedTable ? (
                <>
                  <MenuScreen
                    menuItems={menuItems}
                    categories={categories}
                    tableNumber={selectedTable.number}
                    currency={settings.currency}
                    onProceedToOrder={(items) => {
                      setCurrentOrderItems(items);
                      navigate('/waiter/order');
                    }}
                    onBack={() => navigate('/waiter/tables')}
                    initialItems={currentOrderItems}
                  />
                </>
              ) : <Navigate to="/waiter/tables" replace />
            } />
            <Route path="order" element={
              isAuthenticated && selectedTable ? (
                <>
                  <OrderSummary
                    items={currentOrderItems}
                    currency={settings.currency}
                    taxRate={settings.taxRate}
                    taxEnabled={settings.taxEnabled}
                    tableNumber={selectedTable.number}
                    onSendToKitchen={handleCreateOrder}
                    onBack={() => navigate('/waiter/menu')}
                    onChange={(items) => setCurrentOrderItems(items)}
                    isUpdateMode={!!currentOrder && currentOrder.status === 'pending'}
                    onRefresh={async () => {
                      if (currentOrder) {
                        try {
                          const resp = await ordersAPI.getById(currentOrder.id);
                          if (resp.success) {
                            setCurrentOrder(resp.data);
                            updateOrder(resp.data);
                          }
                        } catch (e) {
                          console.error('Failed to reload order:', e);
                        }
                      }
                    }}
                  />
                </>
              ) : <Navigate to="/waiter/tables" replace />
            } />
            <Route path="bill" element={
              isAuthenticated && currentOrder ? (
                <>
                  <BillScreen
                    order={currentOrder}
                    currency={settings.currency}
                    taxRate={settings.taxRate}
                    taxEnabled={settings.taxEnabled}
                    restaurantName={settings.restaurantName}
                    onMarkAsPaid={handleMarkAsPaid}
                    onPrintBill={handlePrintBill}
                    onAddItems={() => {
                      setCurrentOrderItems([]);
                      navigate('/waiter/menu');
                    }}
                    onRemoveItem={handleRemoveItemFromOrder}
                    onBack={() => navigate('/waiter/tables')}
                    onOrderUpdate={async () => {
                      if (currentOrder) {
                        try {
                          const resp = await ordersAPI.getById(currentOrder.id);
                          if (resp.success) {
                            setCurrentOrder(resp.data);
                            updateOrder(resp.data);
                          }
                        } catch (e) {
                          console.error('Failed to reload order:', e);
                        }
                      }
                    }}
                    onFreeTable={async () => {
                      if (currentOrder && selectedTable) {
                        if (!await confirm({
                          title: 'Free Table',
                          description: 'Are you sure the customers have left and the table is clear?',
                          confirmText: 'Free Table',
                          variant: 'default'
                        })) return;
                        try {
                          const updated = await tablesAPI.update(selectedTable.id, { status: 'free', currentOrderId: null });
                          if (updated.success) {
                            const [tablesResp, ordersResp] = await Promise.all([
                              tablesAPI.getAll(1, 100),
                              ordersAPI.getAll(1, 100)
                            ]);
                            if (tablesResp.success) setTables(tablesResp.data);
                            if (ordersResp.success) setAllOrders(ordersResp.data);

                            toast.success('Table freed successfully');
                            setCurrentOrder(null);
                            setSelectedTable(null);
                            navigate('/waiter/tables');
                          } else {
                            toast.error('Failed to free table');
                          }
                        } catch (e) {
                          console.error(e);
                          toast.error('Error freeing table');
                        }
                      }
                    }}
                  />
                </>
              ) : <Navigate to="/waiter/tables" replace />
            } />
            <Route path="notifications" element={
              isAuthenticated ? (
                <MobileLayout
                  currentPage="notifications"
                  onNavigate={(p) => navigate(`/waiter/${p}`)}
                  unreadNotifications={notifications.filter(n => !n.read).length}
                >
                  <NotificationsPanel
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onDelete={handleDeleteNotification}
                    onClearAll={handleClearAllNotifications}
                    onBack={() => navigate('/waiter/tables')}
                  />
                </MobileLayout>
              ) : <Navigate to="/waiter/login" replace />
            } />
            <Route path="profile" element={
              isAuthenticated && user ? (
                <MobileLayout
                  currentPage="profile"
                  onNavigate={(p) => navigate(`/waiter/${p}`)}
                  unreadNotifications={notifications.filter(n => !n.read).length}
                >
                  <ProfileScreen
                    user={user}
                    restaurantName={settings.restaurantName}
                    onLogout={() => {
                      logout();
                      navigate('/');
                      toast.success('Logged out successfully');
                    }}
                    onBack={() => navigate('/waiter/tables')}
                  />
                </MobileLayout>
              ) : <Navigate to="/waiter/login" replace />
            } />
          </Routes>
        } />

        {/* Admin Flow */}
        <Route path="/admin/*" element={
          <Routes>
            <Route path="login" element={
              <>
                <AdminLogin
                  restaurantName={settings.restaurantName}
                  onLogin={async (email, password) => {
                    try {
                      const userData = await login(email, password, "admin");
                      if (userData && (userData.role === 'admin' || userData.role === 'manager')) {
                        navigate('/admin/dashboard');
                        toast.success(`Welcome back, ${userData.name}!`);
                      } else {
                        toast.error('Admin/Manager access required');
                        logout();
                      }
                    } catch (error: any) {
                      console.log('[DEBUG] Admin login error caught');
                      setTimeout(() => toast.error('Invalid email or password'), 0);
                    }
                  }}
                />
                <div className="fixed bottom-4 left-4 z-50">
                  <Button variant="outline" onClick={() => navigate('/')} className="bg-background/80 backdrop-blur-sm">
                    ← Back to Selection
                  </Button>
                </div>
              </>
            } />
            <Route path="*" element={
              isAuthenticated && user?.role === 'admin' ? (
                <AdminLayout
                  restaurantName={settings.restaurantName}
                  currentPage={location.pathname.split('/')[2] || 'dashboard'}
                  onNavigate={(page) => navigate(`/admin/${page}`)}
                  onLogout={() => {
                    logout();
                    navigate('/');
                    toast.success('Logged out successfully');
                  }}
                >
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard tables={tables} orders={orders} currency={settings.currency} />} />
                    <Route path="orders" element={<OrdersPage orders={orders} />} />
                    <Route path="tables" element={
                      <TableManagement
                        tables={tables}
                        onAddTable={(t: any) => handleAddTable(t)}
                        onBulkAddTables={handleBulkAddTables}
                        onUpdateTable={handleUpdateTable}
                        onDeleteTable={handleDeleteTable}
                      />
                    } />
                    <Route path="menu" element={
                      <MenuManagement
                        menuItems={menuItems}
                        currency={settings.currency}
                        onAddItem={handleAddMenuItem}
                        onUpdateItem={handleUpdateMenuItem}
                        onDeleteItem={handleDeleteMenuItem}
                      />
                    } />
                    <Route path="categories" element={<CategoryManagement />} />
                    <Route path="users" element={
                      <UserManagement
                        users={users}
                        onAddUser={handleAddUser}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={handleDeleteUser}
                        currentUser={user}
                        fetchUsers={() => loadInitialData(true)}
                      />
                    } />
                    <Route path="billing" element={
                      <BillingConsole
                        orders={orders}
                        currency={settings.currency}
                        taxRate={settings.taxRate}
                        taxEnabled={settings.taxEnabled}
                        onMarkAsPaid={handleMarkAsPaid}
                        onPrintBill={handlePrintBill}
                      />
                    } />
                    <Route path="settings" element={
                      <SettingsPanel
                        settings={settings}
                        onSaveSettings={handleSaveSettings}
                      />
                    } />
                    <Route path="reports" element={
                      <SalesReports
                        orders={orders}
                        menuItems={menuItems}
                        currency={settings.currency}
                      />
                    } />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              ) : <Navigate to="/admin/login" replace />
            } />
          </Routes>
        } />

        {/* Kitchen Flow */}
        <Route path="/kitchen/*" element={
          <Routes>
            <Route path="login" element={
              <>
                <KitchenLogin
                  restaurantName={settings.restaurantName}
                  onLogin={async (email, password) => {
                    try {
                      const userData = await login(email, password, "kitchen");
                      if (userData && userData.role === 'kitchen') {
                        navigate('/kitchen/display');
                        toast.success(`Welcome, ${userData.name}!`);
                      } else {
                        toast.error('Kitchen access required');
                        logout();
                      }
                    } catch (error) {
                      console.log('[DEBUG] Kitchen login error caught');
                      setTimeout(() => toast.error('Invalid email or password'), 0);
                    }
                  }}
                />
                <div className="fixed bottom-6 left-6 z-50">
                  <Button variant="outline" onClick={() => navigate('/')} className="px-6 h-12 text-lg bg-background/80 backdrop-blur-sm shadow-lg border-green-900/30 text-zinc-100 hover:bg-zinc-900">
                    ← Back to Selection
                  </Button>
                </div>
              </>
            } />
            <Route path="display" element={
              isAuthenticated && user?.role === 'kitchen' ? (
                <>
                  <KitchenDisplay
                    orders={orders.filter(o => {
                      // 1. Basic status check
                      if (['completed', 'delivered', 'cancelled'].includes(o.status)) return false;

                      // 2. Robust age filter (12 hours) - handle potential NaN
                      const createdAtTime = new Date(o.createdAt).getTime();
                      const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
                      if (isNaN(createdAtTime) || createdAtTime < twelveHoursAgo) return false;

                      // 3. Table occupancy check (Modified: Allow active orders to show even if table is free)
                      const table = realtimeTables.find(t => t.number === o.tableNumber);

                      // Only hide non-active orders if table is not occupied
                      // We must show pending/preparing/ready orders so kitchen can see and clear desynced/zombie orders
                      if (!['pending', 'preparing', 'ready'].includes(o.status)) {
                        if (table && table.status !== 'occupied') return false;
                      }

                      // 4. Hide served orders if table is not found or already freed
                      if (o.status === 'served' && (!table || table.status !== 'occupied')) return false;

                      // 5. Active Order check (Fix for old orders showing when table is re-occupied)
                      if (table && table.currentOrderId && table.currentOrderId !== o.id) return false;

                      return true;
                    })}
                    menuItems={menuItems}
                    onUpdateItemStatus={handleKitchenStatusUpdate}
                    onCancelOrder={handleCancelOrder}
                    onDismissOrder={handleDismissOrder}
                    onRefresh={() => { loadInitialData(true); }}
                  />
                  <div className="fixed bottom-4 left-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="bg-white"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : <Navigate to="/kitchen/login" replace />
            } />
          </Routes>
        } />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

// Wrapper to pass auth state to RealtimeProvider
function RealtimeProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, user } = useAuth();
  return (
    <RealtimeProvider isAuthenticated={isAuthenticated} token={token} user={user}>
      {children}
    </RealtimeProvider>
  );
}

// Main App Component with Providers
export default function App() {
  return (
    <AuthProvider>
      <RealtimeProviderWithAuth>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </RealtimeProviderWithAuth>
    </AuthProvider>
  );
}
