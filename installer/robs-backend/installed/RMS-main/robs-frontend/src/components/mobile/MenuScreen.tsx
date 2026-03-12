import { useState } from 'react';
import { MenuItem, OrderItem, MenuItemModifier } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Plus, Minus, ShoppingCart, Clock, Leaf, Info, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface MenuScreenProps {
  menuItems: MenuItem[];
  categories: string[];
  tableNumber: number;
  currency: string;
  onProceedToOrder: (items: OrderItem[]) => void;
  onBack: () => void;
  initialItems?: OrderItem[];
}

export function MenuScreen({ menuItems, categories, tableNumber, currency, onProceedToOrder, onBack, initialItems = [] }: MenuScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Store cart items with modifiers and notes. Key: "itemId|modId1-modId2|notes"
  const [cart, setCart] = useState<Map<string, { quantity: number, item: MenuItem, modifiers: MenuItemModifier[], notes?: string }>>(() => {
    const initialCart = new Map();
    initialItems.forEach(orderItem => {
      const sortedModIds = orderItem.modifiers?.map(m => m.id).sort().join('-') || '';
      const notes = orderItem.notes || '';
      const key = `${orderItem.menuItem.id}|${sortedModIds}|${notes}`;
      const existing = initialCart.get(key);
      if (existing) {
        initialCart.set(key, { ...existing, quantity: existing.quantity + orderItem.quantity });
      } else {
        initialCart.set(key, { quantity: orderItem.quantity, item: orderItem.menuItem, modifiers: orderItem.modifiers || [], notes: orderItem.notes });
      }
    });
    return initialCart;
  });
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<MenuItemModifier[]>([]);
  const [unavailabilityReasonItem, setUnavailabilityReasonItem] = useState<MenuItem | null>(null);

  // Handle case where selected category might not exist in new list (e.g. after update)
  if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
    setSelectedCategory('All');
  }

  const isAvailable = (item: MenuItem) => {
    if (!item.available) return false;
    if (!item.availableFrom || !item.availableTo) return true;

    const now = new Date();
    const current = format(now, 'HH:mm');
    return current >= item.availableFrom && current <= item.availableTo;
  };

  const getAvailabilityText = (item: MenuItem) => {
    if (!item.available) return "Unavailable";
    if (item.availableFrom && item.availableTo) {
      if (!isAvailable(item)) return `Available ${item.availableFrom} - ${item.availableTo}`;
    }
    return null;
  };

  const filteredItems = (searchQuery
    ? menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : (selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory)))
    .sort((a, b) => {
      const aAvail = isAvailable(a);
      const bAvail = isAvailable(b);
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      if (!aAvail && !bAvail) {
        // Sort unavailable items descending by name
        return b.name.localeCompare(a.name);
      }
      return 0; // Keep original order for available items
    });

  const getCartKey = (itemId: string, mods: MenuItemModifier[], notes: string = '') => {
    const sortedModIds = mods.map(m => m.id).sort().join('-');
    return `${itemId}|${sortedModIds}|${notes}`;
  };

  const addToCart = (item: MenuItem, mods: MenuItemModifier[] = []) => {
    const key = getCartKey(item.id, mods, '');
    const newCart = new Map(cart);
    const existing = newCart.get(key);
    if (existing) {
      newCart.set(key, { ...existing, quantity: existing.quantity + 1 });
    } else {
      newCart.set(key, { quantity: 1, item, modifiers: mods, notes: '' });
    }
    setCart(newCart);
  };

  const handleCreateCartItem = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedItemForModifiers(item);
      setSelectedModifiers([]);
    } else {
      addToCart(item, []);
    }
  };

  const confirmModifiers = () => {
    if (selectedItemForModifiers) {
      addToCart(selectedItemForModifiers, selectedModifiers);
      setSelectedItemForModifiers(null);
      setSelectedModifiers([]);
    }
  };

  const toggleModifier = (mod: MenuItemModifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === mod.id);
      if (exists) return prev.filter(m => m.id !== mod.id);
      return [...prev, mod];
    });
  };

  const removeFromCart = (key: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(key);
    if (current && current.quantity > 1) {
      newCart.set(key, { ...current, quantity: current.quantity - 1 });
    } else {
      newCart.delete(key);
    }
    setCart(newCart);
  };

  const getCartTotal = () => {
    let total = 0;
    cart.forEach((entry) => {
      let itemPrice = entry.item.price;
      entry.modifiers.forEach(m => itemPrice += Number(m.price));
      total += itemPrice * entry.quantity;
    });
    return total;
  };

  const getTotalItems = () => {
    let total = 0;
    cart.forEach((entry) => {
      total += entry.quantity;
    });
    return total;
  };

  const handleProceed = () => {
    const orderItems: OrderItem[] = [];
    cart.forEach((entry) => {
      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuItem: entry.item,
        quantity: entry.quantity,
        status: 'pending',
        notes: entry.notes,
        modifiers: entry.modifiers.map(m => ({ id: m.id, name: m.name, price: Number(m.price) }))
      });
    });
    onProceedToOrder(orderItems);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack} className="text-primary-foreground/90 mb-2 flex items-center gap-1">← Back</button>
        <h2 className="mb-1 font-bold">Menu - Table {tableNumber}</h2>
        <p className="text-primary-foreground/90 text-sm mb-3">Select items to add to order</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-9 bg-background/95 text-foreground border-transparent focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="sticky top-[136px] z-10 bg-background/95 backdrop-blur-sm pt-2 pb-2 border-b border-border/50">
        {!searchQuery && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full flex justify-start overflow-x-auto scrollbar-hide bg-transparent px-4 gap-2 h-auto pb-2">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="whitespace-nowrap flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="p-4 pb-32 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No items found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `No items match "${searchQuery}"`
                : `There are no items available in the ${selectedCategory} category right now.`}
            </p>
          </div>
        ) : filteredItems.map((item) => {
          const available = isAvailable(item);
          const availabilityText = getAvailabilityText(item);
          const quantityInCart = Array.from(cart.values())
            .filter(e => e.item.id === item.id)
            .reduce((acc, curr) => acc + curr.quantity, 0);

          return (
            <Card
              key={item.id}
              className={`p-3 bg-card border-border shadow-sm ${!available ? 'opacity-60 bg-muted cursor-pointer' : ''}`}
              onClick={() => !available && setUnavailabilityReasonItem(item)}
            >
              <div className="flex gap-3">
                <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 relative border border-border overflow-hidden">
                  <span className="text-3xl">{item.category === 'Pizza' ? '🍕' : item.category === 'Burgers' ? '🍔' : item.category === 'Desserts' ? '🍰' : item.category === 'Beverages' ? '🥤' : '🍽️'}</span>
                  {item.isVeg && (
                    <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 shadow-sm">
                      <div className="border border-green-600 p-[1px] rounded-[2px]">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground line-clamp-1">{item.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-snug">{item.description}</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-primary font-bold text-lg">{currency}{item.price}</div>
                      {!available ? (
                        <div className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><Info className="w-3 h-3" /> {availabilityText}</div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {item.preparationTime} min
                        </div>
                      )}
                    </div>

                    {quantityInCart > 0 ? (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            // Find the last added variant of this item to remove
                            const entries = Array.from(cart.entries()).filter(([_, val]) => val.item.id === item.id);
                            if (entries.length > 0) {
                              // Prefer removing from the last entry (stack-like)
                              const lastKey = entries[entries.length - 1][0];
                              removeFromCart(lastKey);
                            }
                          }}
                          className="h-7 w-7 p-0 hover:bg-white text-muted-foreground hover:text-destructive rounded-md"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-sm w-4 text-center">{quantityInCart}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCreateCartItem(item);
                          }}
                          disabled={!available}
                          className="h-7 w-7 p-0 hover:bg-white text-primary hover:text-primary rounded-md"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleCreateCartItem(item);
                        }}
                        disabled={!available}
                        className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50 font-medium"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>


      {
        getTotalItems() > 0 && (
          <div className="fixed bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md border border-border p-4 shadow-xl z-30 pb-safe rounded-xl">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm">{getTotalItems()} items</span>
                    <span className="text-muted-foreground text-xs">Total Bill</span>
                  </div>
                </div>
                <div className="text-foreground font-bold text-xl">{currency}{getCartTotal()}</div>
              </div>
              <Button onClick={handleProceed} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-12 rounded-xl shadow-lg shadow-primary/20">
                Review Order
              </Button>
            </div>
          </div>
        )
      }

      {/* Modifiers Dialog */}
      <Dialog open={!!selectedItemForModifiers} onOpenChange={(open: boolean) => !open && setSelectedItemForModifiers(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Customize {selectedItemForModifiers?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Select add-ons for your item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItemForModifiers?.modifiers?.map(mod => (
              <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={mod.id}
                    checked={selectedModifiers.some(m => m.id === mod.id)}
                    onCheckedChange={() => toggleModifier(mod)}
                  />
                  <div className="grid gap-1.5 label text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    <label htmlFor={mod.id}>{mod.name}</label>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">+{currency}{mod.price}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItemForModifiers(null)}>Cancel</Button>
            <Button onClick={confirmModifiers} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add to Order - {currency}{selectedItemForModifiers ? Number(selectedItemForModifiers.price) + selectedModifiers.reduce((sum, m) => sum + Number(m.price), 0) : 0}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unavailability Reason Dialog */}
      <Dialog open={!!unavailabilityReasonItem} onOpenChange={(open: boolean) => !open && setUnavailabilityReasonItem(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-red-500" />
              Item Unavailable
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              <span className="font-bold text-foreground">{unavailabilityReasonItem?.name}</span> is currently unavailable.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Reason:</h4>
            <p className="p-3 bg-muted rounded-lg text-foreground italic">
              {unavailabilityReasonItem?.availabilityReason || "No specific reason provided."}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setUnavailabilityReasonItem(null)} className="bg-primary hover:bg-primary/90 text-primary-foreground">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
