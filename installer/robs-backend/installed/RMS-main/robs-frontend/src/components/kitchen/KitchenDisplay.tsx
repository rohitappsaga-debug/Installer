import { useState, useEffect } from 'react';
import { Order, OrderItem, OrderStatus } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, CheckCircle, AlertTriangle, RefreshCw, Moon, Sun, Utensils, ListChecks, Trash2 } from 'lucide-react';
import { MenuAvailabilityManager } from './MenuAvailabilityManager';
import { MenuItem } from '../../types';
import { useConfirm } from '../ui/confirm-dialog-provider';

interface KitchenDisplayProps {
  orders: Order[];
  menuItems: MenuItem[];
  onUpdateItemStatus: (orderId: string, itemId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
  onDismissOrder: (orderId: string) => void;
  onRefresh?: () => void;
}

export function KitchenDisplay({ orders, menuItems, onUpdateItemStatus, onCancelOrder, onDismissOrder, onRefresh }: KitchenDisplayProps) {
  const { confirm } = useConfirm();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<'orders' | 'menu'>('orders');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const isDark = darkMode;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [darkMode]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeDiff = (createdAt: string) => {
    const diff = currentTime.getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes;
  };

  const isDelayed = (createdAt: string) => {
    return getTimeDiff(createdAt) > 20;
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
      case 'ready':
        return 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedCategory === 'all') return true;
    return order.status === selectedCategory;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="text-primary">●</span> Kitchen Display
            </h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">
              {currentTime.toLocaleTimeString()} — <span className="text-foreground font-bold">{filteredOrders.length}</span> Active Orders
            </p>
          </div>
          <div className="flex flex-wrap gap-2">

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-10 px-4 text-sm"
                title="Force Refresh Data"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="h-10 px-4 text-sm"
            >
              {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {darkMode ? 'Light' : 'Dark'}
            </Button>
            <Button
              variant={view === 'menu' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(view === 'orders' ? 'menu' : 'orders')}
              className={`h-10 px-4 text-sm ${view === 'menu' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              {view === 'orders' ? (
                <>
                  <Utensils className="w-4 h-4 mr-2" />
                  Manage Menu
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4 mr-2" />
                  Show Orders
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Tabs - Large & Touchable */}
        {view === 'orders' && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl transition-all border-2 font-bold text-base whitespace-nowrap flex items-center justify-center gap-2 ${selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
            >
              ALL
              <span className="text-xs opacity-80 bg-black/20 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{orders.length}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('pending')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl transition-all border-2 font-bold text-base whitespace-nowrap flex items-center justify-center gap-2 ${selectedCategory === 'pending'
                ? 'bg-yellow-500 text-white border-yellow-500 shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-yellow-500/50 hover:text-foreground'
                }`}
            >
              PENDING
              <span className="text-xs opacity-80 bg-black/20 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{pendingCount}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('preparing')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl transition-all border-2 font-bold text-base whitespace-nowrap flex items-center justify-center gap-2 ${selectedCategory === 'preparing'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-blue-500/50 hover:text-foreground'
                }`}
            >
              COOKING
              <span className="text-xs opacity-80 bg-black/20 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{inProgressCount}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('ready')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl transition-all border-2 font-bold text-base whitespace-nowrap flex items-center justify-center gap-2 ${selectedCategory === 'ready'
                ? 'bg-green-500 text-white border-green-500 shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-green-500/50 hover:text-foreground'
                }`}
            >
              READY
              <span className="text-xs opacity-80 bg-black/20 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{readyCount}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {view === 'orders' ? (
          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/50">
                <CheckCircle className="w-32 h-32 mb-6 opacity-20" />
                <p className="text-3xl font-bold">All caught up!</p>
                <p className="text-xl">No orders in this status</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredOrders.map((order) => {
                  const timeDiff = getTimeDiff(order.createdAt);
                  const delayed = isDelayed(order.createdAt);

                  return (
                    <Card
                      key={order.id}
                      className={`flex flex-col h-full overflow-hidden border-2 shadow-sm transition-all ${delayed
                        ? 'bg-red-50 dark:bg-red-950/10 border-red-500 shadow-red-500/10'
                        : 'bg-card border-border hover:border-primary/50'
                        }`}
                    >
                      {/* Card Header */}
                      <div className={`p-4 border-b ${delayed ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'bg-muted/30 border-border'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-2xl font-black text-foreground">Table {order.tableNumber}</h3>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`text-base px-3 py-1 ${getStatusColor(order.status)}`}>
                              {order.status.toUpperCase()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (await confirm({ title: "Clear Order", description: `Clear order for Table ${order.tableNumber}?` })) {
                                  onDismissOrder(order.id);
                                }
                              }}
                              className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Clear from screen"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <Clock className={`w-5 h-5 ${delayed ? 'text-red-500 animate-pulse' : ''}`} />
                            <span className={`text-lg ${delayed ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                              {timeDiff} min
                            </span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground opacity-70">
                            #{order.id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border-l-4 ${item.status === 'ready'
                              ? 'bg-green-50 dark:bg-green-900/10 border-l-green-500'
                              : item.status === 'preparing'
                                ? 'bg-blue-50 dark:bg-blue-900/10 border-l-blue-500'
                                : 'bg-muted/30 border-l-yellow-500'
                              }`}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xl font-bold text-foreground leading-tight">
                                  {item.quantity} × {item.menuItem.name}
                                </span>
                              </div>

                              {item.notes && (
                                <div className="text-base text-orange-600 dark:text-orange-400 font-medium italic bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg">
                                  ⚠️ {item.notes}
                                </div>
                              )}

                              {/* Action Buttons Per Item */}
                              <div className="flex gap-2 mt-2">
                                {item.status === 'pending' && (
                                  <Button
                                    size="lg" // Larger button
                                    onClick={() => onUpdateItemStatus(order.id, item.id, 'preparing')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg"
                                  >
                                    Start Cooking
                                  </Button>
                                )}
                                {item.status === 'preparing' && (
                                  <Button
                                    size="lg" // Larger button
                                    onClick={() => onUpdateItemStatus(order.id, item.id, 'ready')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                                  >
                                    Mark Ready
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Card Footer - Server ID hidden */}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <MenuAvailabilityManager menuItems={menuItems} />
        )}
      </div>
    </div >
  );
}
