import { useState, useEffect } from 'react';
import { MenuItem } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Plus, Edit, Trash2, Search, Clock, Utensils, CheckCircle, XCircle, Filter, MoreHorizontal, ChefHat, Leaf, PlusCircle, X, CalendarClock, CircleDot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { menuAPI } from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../ui/confirm-dialog-provider';

interface MenuManagementProps {
  menuItems: MenuItem[];
  currency: string;
  onAddItem: (item: any) => void;
  onUpdateItem: (id: string, item: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
}

export function MenuManagement({ menuItems, currency, onAddItem, onUpdateItem, onDeleteItem }: MenuManagementProps) {
  const { confirm } = useConfirm();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable'>('all');
  const [filterType, setFilterType] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Dynamic categories state
  const [categoryNames, setCategoryNames] = useState<string[]>(['All', 'Pizza', 'Burgers']);
  const [categoryObjects, setCategoryObjects] = useState<{ name: string, id: string }[]>([]);

  // Modifier State for adding in Edit Mode
  const [newModifier, setNewModifier] = useState({ name: '', price: 0, available: true });

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: 0,
    description: '',
    available: true,
    preparationTime: 15,
    isVeg: true,
    availableFrom: '',
    availableTo: '',
    availabilityReason: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await menuAPI.getCategories();
      if (response.success) {
        // response.data is list of all names
        // response.categories is list of new category objects
        setCategoryNames(['All', ...response.data]);
        if (response.categories) {
          setCategoryObjects(response.categories);
        }
        // Set default category for new item if lists loaded
        if (response.data.length > 0) {
          setNewItem(prev => ({ ...prev, category: response.data[0] }));
        }
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      item.category.toLowerCase().startsWith(searchLower) ||
      item.price.toString().startsWith(searchLower);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'available' ? item.available : !item.available;
    const matchesType = filterType === 'all'
      ? true
      : filterType === 'veg' ? item.isVeg : !item.isVeg;

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  const getCategoryId = (name: string) => {
    const found = categoryObjects.find(c => c.name === name);
    return found ? found.id : undefined;
  };

  const handleCreateItem = () => {
    const catId = getCategoryId(newItem.category);
    onAddItem({
      ...newItem,
      categoryId: catId,
      availableFrom: newItem.availableFrom || null,
      availableTo: newItem.availableTo || null
    });
    setNewItem({
      name: '',
      category: categoryNames.length > 1 ? categoryNames[1] : '',
      price: 0,
      description: '',
      available: true,
      preparationTime: 15,
      isVeg: true,
      availableFrom: '',
      availableTo: '',
      availabilityReason: ''
    });
    setShowAddDialog(false);
  };

  const handleAddModifier = async () => {
    if (!editingItem || !newModifier.name) return;
    try {
      const resp = await menuAPI.addModifier(editingItem.id, newModifier);
      if (resp.success) {
        setEditingItem(prev => prev ? ({ ...prev, modifiers: [...(prev.modifiers || []), resp.data] }) : null);
        setNewModifier({ name: '', price: 0, available: true });
        toast.success('Modifier added');
        onUpdateItem(editingItem.id, {}); // Trigger refresh
      }
    } catch (e) {
      toast.error('Failed to add modifier');
    }
  };

  const handleRemoveModifier = async (modId: string) => {
    try {
      await menuAPI.removeModifier(modId);
      setEditingItem(prev => prev ? ({ ...prev, modifiers: prev.modifiers?.filter(m => m.id !== modId) }) : null);
      toast.success('Modifier removed');
      if (editingItem) onUpdateItem(editingItem.id, {});
    } catch (e) {
      toast.error('Failed to remove modifier');
    }
  };

  const isAvailable = (item: MenuItem) => {
    if (!item.available) return false;
    if (!item.availableFrom || !item.availableTo) return true;

    const now = new Date();
    const current = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    return current >= item.availableFrom && current <= item.availableTo;
  };

  const getAvailabilityStatus = (item: MenuItem) => {
    if (!item.available) return 'unavailable';
    if (item.availableFrom && item.availableTo) {
      if (!isAvailable(item)) return 'time-restricted';
    }
    return 'available';
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      // Create a clean object for updates, excluding ID and timestamps
      const { id, createdAt, updatedAt, ...rest } = editingItem;
      const catId = getCategoryId(editingItem.category);

      const updates = {
        ...rest,
        categoryId: catId
      };

      onUpdateItem(id, updates);
      setEditingItem(null);
    }
  };


  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your culinary offerings and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="h-11 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] border-0">
                <Plus className="w-5 h-5 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            {/* Dialog Content remains mostly same but could use touchup if needed, keeping functional structure */}
            <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/30">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Add New Menu Item</DialogTitle>
                  <DialogDescription>Create a new item in your main menu</DialogDescription>
                </DialogHeader>
              </div>
              <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Item Name</Label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., Truffle Pasta"
                      className="h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Category</Label>
                    <Select value={newItem.category} onValueChange={(value: string) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger className="h-10 bg-muted/50 focus:bg-background transition-colors border-border">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {categoryNames.filter(c => c !== 'All').map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Describe the ingredients and preparation..."
                    className="resize-none h-24 bg-muted/50 focus:bg-background transition-colors border-border"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Price ({currency})</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
                      <Input
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                        className="pl-7 h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Prep Time (mins)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={newItem.preparationTime}
                        onChange={(e) => setNewItem({ ...newItem, preparationTime: Number(e.target.value) })}
                        className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Availability Start (HH:MM)</Label>
                    <div className="relative">
                      <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={newItem.availableFrom} onChange={e => setNewItem({ ...newItem, availableFrom: e.target.value })} placeholder="09:00" className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Availability End (HH:MM)</Label>
                    <div className="relative">
                      <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={newItem.availableTo} onChange={e => setNewItem({ ...newItem, availableTo: e.target.value })} placeholder="22:00" className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium text-foreground">Available for Ordering</Label>
                    <p className="text-sm text-muted-foreground">Toggle this off to temporarily hide from menu</p>
                  </div>
                  <Switch
                    checked={newItem.available}
                    onCheckedChange={(checked: boolean) => setNewItem({ ...newItem, available: checked })}
                  />
                </div>

                {!newItem.available && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Reason for Unavailability (if any)</Label>
                    <Textarea
                      value={newItem.availabilityReason}
                      onChange={(e) => setNewItem({ ...newItem, availabilityReason: e.target.value })}
                      placeholder="e.g. Out of stock, Seasonal item..."
                      className="resize-none h-20 bg-muted/50 focus:bg-background transition-colors border-border"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium text-green-600 flex items-center gap-2"><Leaf className="w-4 h-4" /> Vegetarian</Label>
                  </div>
                  <Switch
                    checked={newItem.isVeg}
                    onCheckedChange={(checked: boolean) => setNewItem({ ...newItem, isVeg: checked })}
                  />
                </div>

                <Button onClick={handleCreateItem} className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium border-0 shadow-lg shadow-orange-500/20 rounded-xl">
                  Add Menu Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Grid */}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 border-border shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Utensils className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl md:rounded-2xl">
              <Utensils className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">Total Items</p>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mt-1">{menuItems.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 border-border shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-green-600" />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-500/10 rounded-xl md:rounded-2xl">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">Available</p>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mt-1">{menuItems.filter(i => isAvailable(i)).length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 border-border shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle className="w-8 h-8 md:w-12 md:h-12 text-red-600" />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-red-500/10 rounded-xl md:rounded-2xl">
              <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">Unavailable</p>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mt-1">{menuItems.filter(i => !isAvailable(i)).length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 border-border shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ChefHat className="w-8 h-8 md:w-12 md:h-12 text-primary" />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl">
              <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">Categories</p>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mt-1">{categoryNames.length - 1}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 md:p-6 border-b border-border bg-card">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background border-input focus:bg-card transition-colors w-full"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border col-span-2 sm:col-span-1 justify-center sm:justify-start">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>

              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-full sm:w-[145px] h-10 border-input bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 border-input bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="veg">Veg Only</SelectItem>
                  <SelectItem value="non-veg">Non-Veg Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 border-input bg-background col-span-2 sm:col-span-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryNames.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-4 px-3 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Details</th>
                <th className="hidden md:table-cell text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="hidden md:table-cell text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="hidden md:table-cell text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prep Time</th>
                <th className="hidden md:table-cell text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-3 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-3 md:px-6">
                    <div className="flex items-start gap-4">
                      {/* Placeholder Avatar since we don't have images yet */}
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5 max-w-[200px]">{item.description}</div>

                        {/* Mobile Only Details */}
                        <div className="md:hidden mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">{currency}{item.price}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-foreground">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.preparationTime}m
                            </span>
                            <div className="flex items-center gap-2">
                              {item.isVeg ? (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-700 text-[10px] h-5 gap-1"><Leaf className="w-3 h-3" /> Veg</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-700 text-[10px] h-5 gap-1"><CircleDot className="w-3 h-3" /> Non-Veg</Badge>
                              )}
                              {getAvailabilityStatus(item) === 'available' ? (
                                <span className="text-[10px] font-medium text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Available</span>
                              ) : (
                                <span className="text-[10px] font-medium text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Unavailable</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="hidden md:table-cell py-4 px-6">
                    <span className="font-semibold text-foreground">{currency}{item.price}</span>
                  </td>
                  <td className="hidden md:table-cell py-4 px-6">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{item.preparationTime}m</span>
                    </div>
                    {item.isVeg ? (
                      <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-700 dark:text-green-400 text-xs gap-1"><Leaf className="w-3 h-3" /> Veg</Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1 bg-red-500/10 text-red-700 dark:text-red-400 text-xs gap-1"><CircleDot className="w-3 h-3" /> Non-Veg</Badge>
                    )}
                  </td>
                  <td className="hidden md:table-cell py-4 px-6 text-sm">
                    {getAvailabilityStatus(item) === 'available' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500"></span>
                        Available
                      </span>
                    ) : getAvailabilityStatus(item) === 'time-restricted' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-orange-500"></span>
                          Time Restricted
                        </span>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.availableFrom}-{item.availableTo}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></span>
                        Unavailable
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 md:px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (await confirm({ title: "Delete Item", description: 'Are you sure you want to delete this item?' })) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No menu items found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog - Reuse similar styling updates as Add Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open: boolean) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Menu Item</DialogTitle>
              <DialogDescription>Modify item details including price, variations, and availability logic</DialogDescription>
            </DialogHeader>
          </div>

          {editingItem && (
            <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Item Name</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Category</Label>
                  <Select value={editingItem.category} onValueChange={(value: string) => setEditingItem(prev => prev ? { ...prev, category: value } : null)}>
                    <SelectTrigger className="h-10 bg-muted/50 focus:bg-background transition-colors border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categoryNames.filter(c => c !== 'All').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Description</Label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="resize-none h-24 bg-muted/50 focus:bg-background transition-colors border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Price ({currency})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
                    <Input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                      className="pl-7 h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Prep Time (mins)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={editingItem.preparationTime}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, preparationTime: Number(e.target.value) } : null)}
                      className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Availability Start (HH:MM)</Label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={editingItem.availableFrom || ''} onChange={e => setEditingItem(prev => prev ? { ...prev, availableFrom: e.target.value } : null)} placeholder="09:00" className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Availability End (HH:MM)</Label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={editingItem.availableTo || ''} onChange={e => setEditingItem(prev => prev ? { ...prev, availableTo: e.target.value } : null)} placeholder="22:00" className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors border-border" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium text-foreground">Available for Ordering</Label>
                  <p className="text-sm text-muted-foreground">Toggle this off to temporarily hide from menu</p>
                </div>
                <Switch
                  checked={editingItem.available}
                  onCheckedChange={(checked: boolean) => setEditingItem(prev => prev ? { ...prev, available: checked } : null)}
                />
              </div>

              {!editingItem.available && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Reason for Unavailability (if any)</Label>
                  <Textarea
                    value={editingItem.availabilityReason || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, availabilityReason: e.target.value } : null)}
                    placeholder="e.g. Out of stock, Seasonal item..."
                    className="resize-none h-20 bg-muted/50 focus:bg-background transition-colors border-border"
                  />
                </div>
              )}


              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium text-green-600 flex items-center gap-2"><Leaf className="w-4 h-4" /> Vegetarian</Label>
                </div>
                <Switch
                  checked={editingItem.isVeg}
                  onCheckedChange={(checked: boolean) => setEditingItem(prev => prev ? { ...prev, isVeg: checked } : null)}
                />
              </div>

              {/* Modifiers Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><PlusCircle className="w-5 h-5" /></span>
                  Add-ons & Modifiers
                </h4>

                <div className="space-y-3">
                  {editingItem.modifiers?.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                      <div>
                        <span className="font-medium text-foreground">{mod.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">+ {currency}{mod.price}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveModifier(mod.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 items-end p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Modifier Name</Label>
                    <Input
                      value={newModifier.name}
                      onChange={e => setNewModifier({ ...newModifier, name: e.target.value })}
                      placeholder="e.g. Extra Cheese"
                      className="h-9 bg-background"
                    />
                  </div>
                  <div className="space-y-2 w-24">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Price</Label>
                    <Input
                      type="number"
                      value={newModifier.price}
                      onChange={e => setNewModifier({ ...newModifier, price: Number(e.target.value) })}
                      className="h-9 bg-background"
                    />
                  </div>
                  <Button onClick={handleAddModifier} size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button onClick={handleUpdateItem} className="flex-1 h-11 bg-primary text-primary-foreground shadow-lg shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform">
                  Save Changes
                </Button>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 h-11 border-border text-foreground hover:bg-muted/50">Cancel</Button>
                </DialogTrigger>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
