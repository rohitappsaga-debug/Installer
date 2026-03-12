import { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { CreditCard, Banknote, Smartphone, Printer, CheckCircle, Plus, Trash2, PauseCircle, PlayCircle, History, RefreshCw, Pencil } from 'lucide-react';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../ui/confirm-dialog-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

interface BillScreenProps {
  order: Order;
  currency: string;
  taxRate: number;
  taxEnabled: boolean;
  onMarkAsPaid: (orderId: string, method: PaymentMethod, amount: number) => void;
  onPrintBill: (order: string | Order) => void;
  onBack: () => void;
  onAddItems: () => void;
  onRemoveItem: (itemId: string) => void;
  onOrderUpdate?: () => void; // Callback to refresh order
  onFreeTable?: () => void;
  restaurantName?: string;
}

export function BillScreen({ order, currency, taxRate, taxEnabled, onMarkAsPaid, onPrintBill, onAddItems, onRemoveItem, onBack, onOrderUpdate, onFreeTable, restaurantName }: BillScreenProps) {
  const { confirm } = useConfirm();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');


  const handleHold = async () => {
    try {
      const resp = await ordersAPI.hold(order.id, !order.holdStatus);
      if (resp.success) {
        toast.success(order.holdStatus ? 'Order Resumed' : 'Order Held');
        if (onOrderUpdate) onOrderUpdate();
      } else {
        toast.error('Failed to update hold status');
      }
    } catch (e) {
      toast.error('Error updating hold status');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    setIsUpdatingItem(true);
    try {
      const resp = await ordersAPI.updateItem(order.id, editingItem.id, {
        quantity: editQuantity,
        notes: editNotes
      });
      if (resp.success) {
        toast.success('Item updated');
        setEditingItem(null);
        if (onOrderUpdate) onOrderUpdate();
      } else {
        toast.error(resp.message || 'Failed to update item');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error updating item');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const subtotal = (order.items || []).reduce((sum, item) => {
    let itemPrice = Number(item.menuItem.price);
    if (item.modifiers) {
      item.modifiers.forEach((m: any) => itemPrice += Number(m.price));
    }
    itemPrice = Math.round(itemPrice * 100) / 100;
    return sum + (itemPrice * item.quantity);
  }, 0);

  const discountAmount = order.discount
    ? order.discount.type === 'percentage'
      ? (subtotal * order.discount.value) / 100
      : order.discount.value
    : 0;

  const afterDiscount = subtotal - discountAmount;
  const tax = taxEnabled ? (afterDiscount * taxRate) / 100 : 0;

  // Current order total
  const currentTotal = Math.round((afterDiscount + tax) * 100) / 100;

  // Full session totals
  const allSessionPayments = [
    ...(order.paymentTransactions || []),
    ...(order.previousOrders?.flatMap(o => (o as any).paymentTransactions || []) || [])
  ];

  const totalPaidInVisit = allSessionPayments
    .filter(t => t.status !== 'refunded')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const sessionTotal = currentTotal + (order.previousPaidTotal || 0);
  const remainingDue = Math.round(Math.max(0, sessionTotal - totalPaidInVisit) * 100) / 100;

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(remainingDue.toFixed(2));
  };

  const confirmPayment = async () => {
    if (selectedPaymentMethod) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount');
        return;
      }

      try {
        onMarkAsPaid(order.id, selectedPaymentMethod, amount);
        setShowPaymentDialog(false);
      } catch (e: any) {
        console.error('Payment Error:', e.response?.data);
        toast.error(e.response?.data?.error || e.response?.data?.message || 'Payment failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <button onClick={onBack} className="text-primary-foreground/90 mb-2 flex items-center gap-1">← Back</button>
            <h2 className="mb-1 font-bold">Table {order.tableNumber} {order.holdStatus && '(HELD)'}</h2>
            <p className="text-primary-foreground/80 text-sm">Order #ORD-{order.orderNumber}</p>
          </div>
          {!order.isPaid && (
            <div className="flex gap-2">
              {onOrderUpdate && (
                <Button size="sm" variant="secondary" onClick={() => onOrderUpdate()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant={order.holdStatus ? "secondary" : "destructive"} onClick={handleHold}>
                {order.holdStatus ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <Card className="p-6 mb-4 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground mb-1 font-bold">{restaurantName || 'The Golden Fork'}</h3>
              <p className="text-sm text-muted-foreground">Restaurant & Bar</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            {order.isPaid ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Paid</Badge>
            ) : (
              <Badge className="bg-primary/10 text-primary border-primary/20">Pending</Badge>
            )}
          </div>

          <Separator className="my-4 bg-border" />

          {/* Items Section */}
          <div className="space-y-4 mb-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-1">Items in this Sitting</h4>

            {/* Flattened Items from all orders in session */}
            {[...(order.previousOrders?.flatMap(o => o.items || []) || []), ...(order.items || [])].map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex justify-between text-sm">
                <div className="flex-1">
                  <div className="text-foreground font-medium flex items-center gap-2">
                    {item.menuItem.name}
                    {item.orderId !== order.id && (
                      <Badge variant="secondary" className="text-[8px] h-3 px-1 bg-gray-100 text-gray-400">Paid</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {item.quantity} × {currency}{Number(item.menuItem.price).toFixed(2)}
                  </div>
                </div>
                <div className="text-foreground text-right">
                  <div>{currency}{(Number(item.menuItem.price) * item.quantity).toFixed(2)}</div>
                  {item.orderId === order.id && (
                    <div className="flex flex-col gap-1 mt-1 items-end">
                      {!order.isPaid && item.status === 'pending' && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditQuantity(item.quantity);
                              setEditNotes(item.notes || '');
                            }}
                            className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-100/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {item.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (await confirm({ title: "Mark Served", description: `Mark ${item.menuItem.name} as Served?` })) {
                              ordersAPI.updateItemStatus(order.id, item.id, 'served')
                                .then(() => {
                                  toast.success(`${item.menuItem.name} Served`);
                                  if (onOrderUpdate) onOrderUpdate();
                                })
                                .catch(() => toast.error('Failed to update status'));
                            }
                          }}
                          className="h-8 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 py-1"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Serve
                        </Button>
                      )}

                      <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 ${item.status === 'pending' ? 'text-muted-foreground border-border' :
                        item.status === 'preparing' ? 'text-blue-500 border-blue-200 dark:border-blue-800' :
                          item.status === 'ready' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 animate-pulse' :
                            'text-muted-foreground'
                        }`}>
                        {item.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4 bg-border" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>

            {order.discount && discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>
                  Discount{' '}
                  {order.discount.type === 'percentage'
                    ? `(${order.discount.value}%)`
                    : ''}
                </span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {taxEnabled && (
              <div className="flex justify-between items-center text-sm text-foreground">
                <span>GST ({taxRate}%)</span>
                <span>{currency}{tax.toFixed(2)}</span>
              </div>
            )}

            <Separator className="my-2 bg-border" />

            <div className="flex justify-between text-foreground font-bold">
              <span>Bill Total (Full Sitting)</span>
              <span>{currency}{sessionTotal.toFixed(2)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Amount Paid so far</span>
                <span>{currency}{totalPaidInVisit.toFixed(2)}</span>
              </div>
              {allSessionPayments.length > 0 && (
                <div className="pl-4 space-y-0.5 border-l border-muted/30 ml-1">
                  {allSessionPayments.filter(t => t.status !== 'refunded').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((tx, idx) => (
                    <div key={tx.id || idx} className="flex justify-between text-[10px] text-muted-foreground/70 italic">
                      <span>{tx.method.toUpperCase()} Payment</span>
                      <span>{currency}{Number(tx.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between text-blue-600 font-bold pt-1 border-t border-blue-100">
              <span>Amount Due</span>
              <span>{currency}{remainingDue.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Table: {order.tableNumber}</div>
              <div>Order ID: #ORD-{order.orderNumber}</div>
            </div>
          </div>
        </Card>

        {
          order.isPaid ? (
            <Card className="p-4 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                <div>
                  <div className="text-green-900 dark:text-green-400 font-medium">Order Fully Paid</div>
                  <div className="text-sm text-green-700 dark:text-green-500/80">
                    Total Session: {currency}{sessionTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-2">
                {order.previousPaidTotal ? (
                  <div className="flex justify-between text-blue-600 font-medium py-1 border-b border-dashed border-blue-200">
                    <span>Previously Paid</span>
                    <span>{currency}{Number(order.previousPaidTotal).toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-sm text-primary/80">
                      Total Bill
                    </div>
                    <div className="text-xl font-bold text-primary">{currency}{sessionTotal.toFixed(2)}</div>
                  </div>
                  <div className="text-right text-sm text-primary/70">
                    <div>Paid: {currency}{totalPaidInVisit.toFixed(2)}</div>
                    <div className="text-foreground font-bold text-base mt-1">Due: {currency}{remainingDue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </Card>
          )
        }

        {/* Payment History */}
        {
          order.paymentTransactions && order.paymentTransactions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2"><History className="w-4 h-4" /> Payment History</h4>
              <div className="space-y-2">
                {order.paymentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center text-sm p-2 bg-card rounded border border-border">
                    <div>
                      <div className="font-medium capitalize text-foreground">{tx.method}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={tx.status === 'refunded' ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>
                        {currency}{Number(tx.amount).toFixed(2)}
                      </span>
                      {tx.status === 'refunded' ? (
                        <Badge variant="outline" className="text-red-500 border-red-200 dark:border-red-900/50 text-[10px]">Refunded</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Refund Transaction"
                          onClick={async () => {
                            if (await confirm({ title: "Refund Transaction", description: 'Are you sure you want to refund this transaction?', variant: 'destructive' })) {
                              try {
                                await paymentsAPI.refundTransaction(tx.id);
                                toast.success('Refund processed');
                                if (onOrderUpdate) onOrderUpdate();
                              } catch (e) { toast.error('Refund failed'); }
                            }
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      </div>

      <div className="fixed bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md border border-border p-4 shadow-xl pb-safe z-20 rounded-xl">
        <div className="flex gap-2">
          {/* Free Table - Visible when Paid */}
          {order.isPaid && (
            <Button
              onClick={() => {
                if (onFreeTable) onFreeTable();
              }}
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/5"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Free Table
            </Button>
          )}

          <Button
            onClick={() => onPrintBill(order)}
            variant="outline"
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            {order.isPaid ? 'Reprint Bill' : 'Print Bill'}
          </Button>
          {!order.isPaid && (
            <Button
              onClick={() => setShowPaymentDialog(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>

        {/* Mark as Served (Waiter Confirmation) - Show if not yet served, regardless of payment */}
        {order.status !== 'served' && order.items?.some(i => i.status === 'ready') && (
          <div className="mt-3">
            <Button
              onClick={async () => {
                if (await confirm({ title: "Mark all Served", description: 'Mark entire order as Served?' })) {
                  try {
                    await ordersAPI.updateStatus(order.id, 'served');
                    toast.success('Order marked as Served');
                    if (onOrderUpdate) onOrderUpdate();
                  } catch (e) { toast.error('Failed to update status'); }
                }
              }}
              variant="outline"
              className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Order as Served
            </Button>
          </div>
        )}

        {/* Add Items Button - Visible until table is freed, even if paid */}
        <div className="mt-3">
          <Button
            onClick={onAddItems}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Select Payment Method</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Total Amount: {currency}{sessionTotal.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <button
              onClick={() => handlePaymentSelect('cash')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${selectedPaymentMethod === 'cash'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50 bg-card hover:bg-primary/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-foreground font-medium">Cash</div>
                  <div className="text-sm text-muted-foreground">Pay with cash</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePaymentSelect('card')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${selectedPaymentMethod === 'card'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50 bg-card hover:bg-primary/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-foreground font-medium">Card</div>
                  <div className="text-sm text-muted-foreground">Credit/Debit card</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePaymentSelect('upi')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${selectedPaymentMethod === 'upi'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50 bg-card hover:bg-primary/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-foreground font-medium">UPI</div>
                  <div className="text-sm text-muted-foreground">Pay via UPI</div>
                </div>
              </div>
            </button>

            <div className="mt-4">
              <Label className="text-foreground">Amount to Pay</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="mt-1 bg-background border-border text-foreground"
              />
              {/* <div className="text-xs text-gray-500 mt-1">Remaining: ₹{remainingDue.toFixed(2)}</div> */}
            </div>

            <Button
              onClick={confirmPayment}
              disabled={!selectedPaymentMethod || !paymentAmount}
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
            >
              Confirm Payment of {currency}{Number(paymentAmount).toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open: boolean) => !open && setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Item</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem?.menuItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={editQuantity}
                onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Special Notes</Label>
              <Input
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="e.g. Extra spicy, No onions"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              onClick={handleUpdateItem}
              disabled={isUpdatingItem}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUpdatingItem ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
