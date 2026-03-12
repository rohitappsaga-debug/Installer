import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Plus, Edit, Trash2, Search, ArrowLeft, MoreVertical, LayoutGrid, Check, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Filter } from 'lucide-react';

import { toast } from 'sonner';
import { useConfirm } from '../ui/confirm-dialog-provider';

interface Category {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    _count?: {
        menuItems: number;
    };
}

interface CategoryManagementProps {
    onBack?: () => void;
}

export function CategoryManagement({ onBack }: CategoryManagementProps) {
    const { confirm } = useConfirm();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [showDialog, setShowDialog] = useState(false);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [bulkInput, setBulkInput] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const sanitizeData = async () => {
            const typoCat = categories.find(c => c.name === 'South Indain');
            if (typoCat) {
                try {
                    await categoriesAPI.update(typoCat.id, {
                        name: 'South Indian',
                        description: 'Delicious South Indian food.',
                        isActive: typoCat.isActive
                    });
                    loadCategories();
                } catch (e) {
                    console.error('Failed to auto-fix typo', e);
                }
            }
        };
        if (categories.length > 0) sanitizeData();
    }, [categories]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const response = await categoriesAPI.getAll();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            isActive: true
        });
        setEditingCategory(null);
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            isActive: category.isActive
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            if (editingCategory) {
                const response = await categoriesAPI.update(editingCategory.id, formData);
                if (response.success) {
                    toast.success('Category updated successfully');
                    loadCategories();
                    setShowDialog(false);
                } else {
                    toast.error(response.message || 'Failed to update category');
                }
            } else {
                const response = await categoriesAPI.create(formData);
                if (response.success) {
                    toast.success('Category created successfully');
                    loadCategories();
                    setShowDialog(false);
                } else {
                    toast.error(response.message || 'Failed to create category');
                }
            }
        } catch (error) {
            console.error('Failed to save category', error);
            toast.error('An error occurred while saving');
        }
    };

    const handleBulkSubmit = async () => {
        if (!bulkInput.trim()) {
            toast.error('Please enter at least one category name');
            return;
        }

        const names = bulkInput
            .split(/[\n,]+/)
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (names.length === 0) {
            toast.error('No valid category names found');
            return;
        }

        try {
            const categoriesToCreate = names.map(name => ({
                name,
                description: '',
                isActive: true
            }));

            const response = await categoriesAPI.bulkCreate(categoriesToCreate);
            if (response.success) {
                toast.success(`${response.data.count} categories created successfully`);
                loadCategories();
                setShowBulkDialog(false);
                setBulkInput('');
            } else {
                toast.error(response.message || 'Failed to bulk create categories');
            }
        } catch (error: any) {
            console.error('Failed to bulk save categories', error);
            toast.error(error.response?.data?.message || 'An error occurred while saving');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!await confirm({ title: "Delete Category", description: `Are you sure you want to delete category "${name}"?` })) return;

        try {
            const response = await categoriesAPI.delete(id);
            if (response.success) {
                toast.success('Category deleted successfully');
                loadCategories();
            } else {
                toast.error(response.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Failed to delete category', error);
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'active' ? cat.isActive : !cat.isActive;

        return matchesSearch && matchesStatus;
    });

    const getGradient = (name: string) => {
        const gradients = [
            'from-rose-500 to-pink-600',
            'from-orange-500 to-red-600',
            'from-amber-500 to-orange-600',
            'from-emerald-500 to-green-600',
            'from-blue-500 to-indigo-600',
            'from-violet-500 to-purple-600',
            'from-fuchsia-500 to-pink-600',
            'from-cyan-500 to-blue-600',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return gradients[Math.abs(hash) % gradients.length];
    };

    return (
        <div className="p-8 mx-auto space-y-8 bg-background/50 min-h-screen">
            {/* Header Section */}
            {/* Optimized Layout for Categories */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        {onBack && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onBack}
                                className="h-10 w-10 rounded-full border-border hover:bg-muted hover:text-primary transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Menu Categories</h1>
                    </div>
                    <p className="text-muted-foreground ml-1 text-lg">Organize and manage your menu sections</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-11 px-6 border-orange-500 text-orange-600 hover:bg-orange-50 transition-all rounded-full">
                                <Plus className="w-5 h-5 mr-2" />
                                Bulk Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl">
                            <div className="p-6 border-b border-border bg-muted/30">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-foreground">Bulk Add Categories</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Enter multiple category names separated by commas or new lines.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Category Names</Label>
                                    <Textarea
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder="e.g. Desserts, Beverages, Sides"
                                        className="min-h-[150px] resize-none bg-muted/50 focus:bg-background transition-colors border-border"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Separate names with commas or press Enter for each new category.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleBulkSubmit}
                                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/20 border-0"
                                >
                                    Create Categories
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showDialog} onOpenChange={(open: boolean) => {
                        setShowDialog(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] rounded-full border-0">
                                <Plus className="w-5 h-5 mr-2" />
                                Add New Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl">
                            <div className="p-6 border-b border-border bg-muted/30">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-foreground">{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        {editingCategory ? 'Update existing category details' : 'Create a new category for your menu'}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Category Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Signature Burgers"
                                        className="h-11 bg-muted/50 focus:bg-background transition-colors border-border"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe this category..."
                                        className="min-h-[100px] resize-none bg-muted/50 focus:bg-background transition-colors border-border"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                                    <div className="space-y-0.5">
                                        <Label className="font-medium text-foreground">Visibility Status</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {formData.isActive ? 'Category is visible on menu' : 'Category is hidden from menu'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/20 border-0"
                                >
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search Bar & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative flex-1 w-full max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-card border-border focus:border-primary rounded-xl shadow-sm text-base w-full"
                    />
                </div>

                <div className="flex w-full md:w-auto items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm justify-between md:justify-start">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Status:</span>
                    </div>
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                        <SelectTrigger className="w-[140px] md:w-[140px] flex-1 border-0 focus:ring-0 bg-transparent">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCategories.map((category) => {
                    const gradient = getGradient(category.name);

                    return (
                        <Card key={category.id} className="group relative bg-card border-border hover:border-primary/50 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-md">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEdit(category); }}
                                    className="p-1.5 bg-background/80 backdrop-blur-sm hover:bg-blue-50 text-muted-foreground hover:text-blue-600 rounded-full shadow-sm"
                                >
                                    <Edit className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(category.id, category.name); }}
                                    className="p-1.5 bg-background/80 backdrop-blur-sm hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-full shadow-sm"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="p-4 flex flex-col items-center text-center space-y-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm bg-gradient-to-br ${gradient}`}>
                                    {category.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="space-y-1 w-full">
                                    <h3 className="font-semibold text-foreground truncate" title={category.name}>
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <span className={`px-1.5 py-0.5 rounded-full ${category.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span>•</span>
                                        <span>{category._count?.menuItems || 0} items</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No categories found</h3>
                    <p className="text-muted-foreground max-w-md text-center mb-8">
                        {searchQuery
                            ? `No results found for "${searchQuery}".`
                            : "Create your first category to get started!"}
                    </p>
                    <Button
                        onClick={() => {
                            if (searchQuery) setSearchQuery('');
                            else setShowDialog(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white h-11 px-8 rounded-full"
                    >
                        {searchQuery ? 'Clear Search' : 'Create Category'}
                    </Button>
                </div>
            )}
        </div>
    );
}
