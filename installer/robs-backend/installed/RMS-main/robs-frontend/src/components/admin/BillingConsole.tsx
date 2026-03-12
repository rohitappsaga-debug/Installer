import { Order, PaymentMethod } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Printer, CheckCircle, Search, Eye } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface BillingConsoleProps {
  orders: Order[];
  currency: string;
  taxRate: number;
  taxEnabled: boolean;
  onMarkAsPaid: (orderId: string, paymentMethod: PaymentMethod) => void;
  onPrintBill: (order: string | Order) => void;
}

export function BillingConsole({ orders, currency, taxRate, taxEnabled, onMarkAsPaid, onPrintBill }: BillingConsoleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'all'>('7days');

  const calculateBillDetails = (order: Order) => {
    const subtotal = order.items.reduce((sum, item) => {
      let itemPrice = Number(item.menuItem.price);
      if (item.modifiers) {
        (item.modifiers as any).forEach((m: any) => {
          itemPrice += Number(m.price || 0);
        });
      }
      return sum + itemPrice * item.quantity;
    }, 0);
    const discountAmount = order.discount
      ? order.discount.type === 'percentage'
        ? (subtotal * order.discount.value) / 100
        : order.discount.value
      : 0;
    const afterDiscount = subtotal - discountAmount;
    const tax = taxEnabled ? (afterDiscount * taxRate) / 100 : 0;
    const total = afterDiscount + tax;
    return { subtotal, discountAmount, tax, total };
  };

  // Helper for search logic across all fields
  const matchesSearch = (order: Order, query: string) => {
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) return true;

    // Special case: Searching specifically for an order number with prefix
    if (searchLower.startsWith('#') || searchLower.startsWith('ord-')) {
      const cleanSearch = searchLower.replace(/^#/, '').replace(/^ord-/, '');
      return order.orderNumber.toString() === cleanSearch;
    }

    // Table Number - exact match
    const tableStr = (order.tableNumber || '').toString();
    if (tableStr === searchLower) {
      return true;
    }

    // Order number (without prefix) - exact match
    if (order.orderNumber.toString() === searchLower) {
      return true;
    }

    // Amount - starts with
    const { total } = calculateBillDetails(order);
    if (total.toString().startsWith(searchLower) || total.toFixed(2).startsWith(searchLower)) {
      return true;
    }

    // Item names
    const itemNamesMatch = order.items.some(item =>
      item.menuItem.name.toLowerCase().includes(searchLower)
    );
    if (itemNamesMatch) return true;

    // Delivery details
    const deliveryMatch = order.deliveryDetails ? (
      order.deliveryDetails.customerName.toLowerCase().includes(searchLower) ||
      order.deliveryDetails.customerPhone.includes(searchLower) ||
      order.deliveryDetails.address.toLowerCase().includes(searchLower)
    ) : false;
    if (deliveryMatch) return true;

    // Status & Payment
    const statusMatch = order.status.toLowerCase().includes(searchLower);
    const paymentMethodMatch = (order.paymentMethod || '').toLowerCase().includes(searchLower);

    // Date - partial match
    const dateStr = new Date(order.createdAt).toLocaleDateString().toLowerCase();
    if (dateStr.includes(searchLower)) return true;

    return statusMatch || paymentMethodMatch;
  };

  const filteredOrders = orders.filter(order => {
    // Apply search
    if (!matchesSearch(order, searchQuery)) return false;

    // Date Filter - Only apply to paid orders
    if (dateFilter !== 'all' && order.isPaid) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === '7days') return diffDays <= 7;
      if (dateFilter === '30days') return diffDays <= 30;
    }

    return true;
  });

  const pendingOrders = orders.filter(o => !o.isPaid).filter(o => matchesSearch(o, searchQuery));
  const paidOrders = filteredOrders.filter(o => o.isPaid);

  const viewBill = (order: Order) => {
    setSelectedOrder(order);
    setShowBillDialog(true);
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const paidToday = orders.filter(o => o.isPaid && isToday(o.createdAt));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-foreground mb-2">Billing Console</h1>
        <p className="text-muted-foreground">View and manage bills for all orders</p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-input"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={dateFilter} onValueChange={(value: '7days' | '30days' | 'all') => setDateFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-card border-border flex flex-col items-center justify-center text-center">
          <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Bills</div>
          <div className="text-lg md:text-2xl font-bold text-foreground">{filteredOrders.length}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-card border-border flex flex-col items-center justify-center text-center">
          <div className="text-xs md:text-sm text-muted-foreground mb-1">Pending</div>
          <div className="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">{orders.filter(o => !o.isPaid).length}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-card border-border flex flex-col items-center justify-center text-center">
          <div className="text-xs md:text-sm text-muted-foreground mb-1">Paid Today</div>
          <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">{paidToday.length}</div>
        </Card>
      </div>

      {/* Pending Bills */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-foreground mb-4">Pending Payments</h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => {
              const { total } = calculateBillDetails(order);
              return (
                <Card key={order.id} className="p-4 border-l-4 border-l-orange-500 bg-card border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-foreground">Order #ORD-{order.orderNumber}</span>
                        <Badge variant="outline" className="text-muted-foreground">Table {order.tableNumber}</Badge>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{order.items.length} items</span>
                        <span>•</span>
                        <span className="text-foreground">{currency}{total.toFixed(2)}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewBill(order)}
                        className="flex-1 md:flex-none border-border hover:bg-muted"
                      >
                        <Eye className="w-4 h-4 md:mr-2" />
                        <span className="md:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintBill(order)}
                        className="flex-1 md:flex-none border-border hover:bg-muted"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onMarkAsPaid(order.id, 'cash')}
                        className="flex-[2] md:flex-none bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Bills */}
      <div>
        <h2 className="text-foreground mb-4">Paid Bills</h2>
        <Card className="p-6 bg-card border-border">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Table</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Items</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Payment</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Time</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((order) => {
                  const { total } = calculateBillDetails(order);
                  return (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">#ORD-{order.orderNumber}</td>
                      <td className="py-3 px-4 text-foreground">{order.tableNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{order.items.length} items</td>
                      <td className="py-3 px-4 text-foreground">{currency}{total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800">
                          {order.paymentMethod?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewBill(order)}
                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintBill(order)}
                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paidOrders.map((order) => {
              const { total } = calculateBillDetails(order);
              return (
                <div key={order.id} className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">#ORD-{order.orderNumber}</span>
                        <Badge variant="outline" className="text-xs">Table {order.tableNumber}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800">
                      {order.paymentMethod?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t border-b border-border/50 my-3">
                    <span className="text-sm text-muted-foreground">{order.items.length} items</span>
                    <span className="font-bold text-foreground">{currency}{total.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewBill(order)}
                      className="flex-1 hover:bg-primary/10 hover:text-primary"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintBill(order)}
                      className="flex-1 hover:bg-primary/10 hover:text-primary"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bill Detail Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order #ORD-${selectedOrder.orderNumber} - Table ${selectedOrder.tableNumber}`}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div className="text-foreground">{item.menuItem.name}</div>
                      <div className="text-muted-foreground">
                        {item.quantity} × {currency}{item.menuItem.price}
                      </div>
                    </div>
                    <div className="text-foreground">{currency}{item.menuItem.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                {(() => {
                  const { subtotal, discountAmount, tax, total } = calculateBillDetails(selectedOrder);
                  return (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{currency}{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span>-{currency}{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {taxEnabled && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>GST ({taxRate}%)</span>
                          <span>{currency}{tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-foreground pt-2 border-t border-border">
                        <span>Total</span>
                        <span>{currency}{total.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onPrintBill(selectedOrder)}
                  className="flex-1 border-border hover:bg-muted"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Bill
                </Button>
                {!selectedOrder.isPaid && (
                  <Button
                    onClick={() => {
                      onMarkAsPaid(selectedOrder.id, 'cash');
                      setShowBillDialog(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
