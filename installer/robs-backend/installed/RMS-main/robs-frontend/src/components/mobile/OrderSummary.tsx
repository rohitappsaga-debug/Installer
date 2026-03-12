import { useState } from 'react';
import { OrderItem } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Minus, Send, Percent, IndianRupee, Trash2, RefreshCw, Split } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';

interface OrderSummaryProps {
  items: OrderItem[];
  currency: string;
  taxRate: number;
  taxEnabled: boolean;
  tableNumber: number;
  onSendToKitchen: (items: OrderItem[], discount?: { type: 'percentage' | 'amount'; value: number }) => void;
  onBack: () => void;
  isUpdateMode?: boolean;
  onRefresh?: () => void;
  onChange?: (items: OrderItem[]) => void;
}

export function OrderSummary({ items: initialItems, currency, taxRate, taxEnabled, tableNumber, onSendToKitchen, onBack, isUpdateMode = false, onRefresh, onChange }: OrderSummaryProps) {
  const [items, setItems] = useState(initialItems);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);

  const updateItems = (newItems: OrderItem[]) => {
    setItems(newItems);
    if (onChange) {
      onChange(newItems);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = items.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    updateItems(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter(item => item.id !== itemId);
    updateItems(updated);
  };

  const updateNotes = (itemId: string, notes: string) => {
    const updated = items.map(item =>
      item.id === itemId ? { ...item, notes } : item
    );
    updateItems(updated);
  };

  const splitItem = (itemId: string) => {
    const itemToSplit = items.find(item => item.id === itemId);
    if (!itemToSplit || itemToSplit.quantity <= 1) return;

    const newItems: OrderItem[] = [];
    for (let i = 0; i < itemToSplit.quantity; i++) {
      newItems.push({
        ...itemToSplit,
        id: `split-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        quantity: 1,
      });
    }

    const updated = items.flatMap(item =>
      item.id === itemId ? newItems : item
    );
    updateItems(updated);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const getTax = () => {
    if (!taxEnabled) return 0;
    const afterDiscount = getSubtotal() - getDiscountAmount();
    return (afterDiscount * taxRate) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount() + getTax();
  };

  const handleSendToKitchen = () => {
    const discount = discountValue > 0 ? { type: discountType, value: discountValue } : undefined;
    onSendToKitchen(items, discount);
  };

  const applyDiscount = () => {
    setShowDiscountDialog(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No items in order</p>
          <Button onClick={onBack} className="bg-orange-500 hover:bg-orange-600">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <button onClick={onBack} className="text-primary-foreground/90 mb-2 flex items-center gap-1">← Back</button>
            <h2 className="mb-1 font-bold">Order Summary - Table {tableNumber}</h2>
            <p className="text-primary-foreground/90 text-sm">Review and modify your order</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4 bg-card border-border">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-foreground">{item.menuItem.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.menuItem.category}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.quantity > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => splitItem(item.id)}
                        className="text-primary hover:text-primary/80 p-1 h-8 px-2 flex items-center gap-1 text-xs hover:bg-primary/10"
                      >
                        <Split className="w-3 h-3" />
                        Add individual notes
                      </Button>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive/80 p-1 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center text-foreground">{item.quantity}</span>
                    <Button
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-foreground">{currency}{item.menuItem.price * item.quantity}</div>
                </div>

                <div>
                  <Label htmlFor={`notes-${item.id}`} className="text-xs text-muted-foreground">
                    Special Instructions (optional)
                  </Label>
                  <Textarea
                    id={`notes-${item.id}`}
                    placeholder="e.g., less spicy, no onions..."
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    className="mt-1 h-16 text-sm"
                  />
                </div>
              </div>
            </div>
            {/* Show modifiers summary */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Includes: {item.modifiers.map(m => m.name).join(', ')}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border shadow-top pb-safe z-20">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{currency}{getSubtotal()}</span>
          </div>

          {discountValue > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Discount ({discountType === 'percentage' ? `${discountValue}%` : `${currency}${discountValue}`})
              </span>
              <span className="text-green-600">-{currency}{getDiscountAmount().toFixed(2)}</span>
            </div>
          )}

          {taxEnabled && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="text-foreground">{currency}{getTax().toFixed(2)}</span>
            </div>
          )}

          <div className="h-px bg-border"></div>

          <div className="flex items-center justify-between">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{currency}{getTotal().toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  {discountValue > 0 ? 'Edit Discount' : 'Apply Discount'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply Discount</DialogTitle>
                  <DialogDescription>
                    Choose discount type and enter value
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <RadioGroup value={discountType} onValueChange={(v: string) => setDiscountType(v as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage" className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Percentage
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amount" id="amount" />
                      <Label htmlFor="amount" className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Fixed Amount
                      </Label>
                    </div>
                  </RadioGroup>

                  <div>
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setDiscountValue(0);
                          return;
                        }

                        let numericVal = parseFloat(val);

                        // Rule 1: No negative values
                        if (numericVal < 0) {
                          toast.error('Discount cannot be negative');
                          return; // Block negative input
                        }

                        // Rule 2: Max 100 for percentage
                        if (discountType === 'percentage' && numericVal > 100) {
                          toast.error('Percentage discount cannot exceed 100%');
                          numericVal = 100;
                        }

                        setDiscountValue(numericVal);
                      }}
                      onKeyDown={(e) => {
                        // Prevent minus sign from being typed
                        if (e.key === '-' || e.key === 'e' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasteData = e.clipboardData.getData('text');
                        if (pasteData.includes('-')) {
                          e.preventDefault();
                          toast.error('Negative values are not allowed');
                        }
                      }}
                      placeholder={discountType === 'percentage' ? 'Enter %' : `Enter ${currency}`}
                      className="mt-2"
                      min="0"
                      max={discountType === 'percentage' ? "100" : undefined}
                    />
                  </div>

                  <Button onClick={applyDiscount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Apply Discount
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={onBack} variant="outline" className="px-3">
              <Plus className="w-5 h-5" />
            </Button>
            <Button onClick={handleSendToKitchen} className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
              <Send className="w-4 h-4 mr-2" />
              {isUpdateMode ? 'Update Order' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
