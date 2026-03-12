import { useState, useEffect } from 'react';
import { Trash2, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { inventoryAPI } from '../../services/api';
import { useConfirm } from '../ui/confirm-dialog-provider';

// Simple Types locally
interface Ingredient {
    id: string;
    name: string;
    unit: string;
    stock: number;
    minLevel: number;
}

export function InventoryDashboard() {
    const { confirm } = useConfirm();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

    // Form states
    const [formData, setFormData] = useState({ name: '', unit: 'kg', stock: 0, minLevel: 0 });
    const [adjustData, setAdjustData] = useState({ quantity: 0, type: 'restock' as 'restock' | 'wastage' | 'correction', reason: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadIngredients();
    }, []);

    const loadIngredients = async () => {
        setIsLoading(true);
        try {
            const resp = await inventoryAPI.getAll();
            if (resp.success) {
                setIngredients(resp.data);
            }
        } catch (e) {
            toast.error('Failed to load ingredients');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const resp = await inventoryAPI.create(formData);
            if (resp.success) {
                toast.success('Ingredient added');
                setIsAddModalOpen(false);
                setFormData({ name: '', unit: 'kg', stock: 0, minLevel: 0 });
                loadIngredients();
            } else {
                toast.error(resp.message || 'Failed');
            }
        } catch (e) {
            toast.error('Error creating ingredient');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!await confirm({ title: "Delete Ingredient", description: `Are you sure you want to delete ${name}? This action cannot be undone.` })) return;

        try {
            const resp = await inventoryAPI.delete(id);
            if (resp.success) {
                toast.success('Ingredient deleted');
                loadIngredients();
            } else {
                toast.error(resp.message || 'Failed to delete');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Error deleting ingredient');
        }
    };

    const handleAdjust = async () => {
        if (!selectedIngredient) return;
        try {
            const resp = await inventoryAPI.adjustStock(selectedIngredient.id, {
                quantity: Math.abs(adjustData.quantity),
                type: adjustData.type,
                reason: adjustData.reason
            });
            if (resp.success) {
                toast.success('Stock updated');
                setIsAdjustModalOpen(false);
                setAdjustData({ quantity: 0, type: 'restock', reason: '' });
                loadIngredients();
            } else {
                toast.error(resp.message || 'Failed');
            }
        } catch (e) {
            toast.error('Error adjusting stock');
        }
    };

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                    <p className="text-gray-500">Track stock levels and ingredients</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ingredients..."
                            className="pl-9 p-2 border rounded-lg w-64 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>+ Add Ingredient</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-4 px-6 font-medium text-gray-600">Name</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-600">Stock</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-600">Unit</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-600">Alert Level</th>
                            <th className="text-right py-4 px-6 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIngredients.map(ing => (
                            <tr key={ing.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-4 px-6 font-medium">{ing.name}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 rounded-full text-xs ${ing.stock <= ing.minLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {ing.stock}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-500">{ing.unit}</td>
                                <td className="py-4 px-6 text-gray-500">{ing.minLevel}</td>
                                <td className="py-4 px-6 text-right">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedIngredient(ing); setIsAdjustModalOpen(true); }} className="mr-2">
                                        Adjust
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ing.id, ing.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredIngredients.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">No ingredients found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add Ingredient</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit</label>
                                    <select className="w-full p-2 border rounded-lg" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                        <option value="kg">kg</option>
                                        <option value="g">gram</option>
                                        <option value="l">liter</option>
                                        <option value="ml">ml</option>
                                        <option value="pcs">pcs</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Min Level (Alert)</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={formData.minLevel} onChange={e => setFormData({ ...formData, minLevel: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {isAdjustModalOpen && selectedIngredient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Adjust Stock: {selectedIngredient.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <div className="flex gap-2">
                                    {['restock', 'wastage', 'correction'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setAdjustData({ ...adjustData, type: t as any })}
                                            className={`px-3 py-1 rounded-lg border ${adjustData.type === t ? 'bg-orange-100 border-orange-500 text-orange-700' : 'border-gray-200'}`}
                                        >
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity ({selectedIngredient.unit})</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={adjustData.quantity}
                                    onChange={e => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={adjustData.reason}
                                    onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAdjust}>Update</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
