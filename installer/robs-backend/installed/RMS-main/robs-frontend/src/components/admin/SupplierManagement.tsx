import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Phone, Mail, MapPin, Package } from 'lucide-react';
import { suppliersAPI } from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../ui/confirm-dialog-provider';

interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    _count?: { purchaseOrders: number };
}

export function SupplierManagement() {
    const { confirm } = useConfirm();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({});

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const resp = await suppliersAPI.getAll();
            if (resp.success) {
                setSuppliers(resp.data);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const resp = await suppliersAPI.create(newSupplier as any);
            if (resp.success) {
                toast.success('Supplier added successfully');
                fetchSuppliers();
                setShowAddForm(false);
                setNewSupplier({});
            }
        } catch (error) {
            console.error('Failed to create supplier', error);
            toast.error('Failed to create supplier');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: "Delete Supplier", description: "Are you sure you want to delete this supplier?" })) return;
        try {
            const resp = await suppliersAPI.delete(id);
            if (resp.success) {
                toast.success('Supplier deleted');
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Failed to delete supplier', error);
            toast.error('Failed to delete supplier');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Supplier Management</h2>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            {showAddForm && (
                <Card className="p-4 mb-6">
                    <h3 className="font-medium mb-3">New Supplier</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input placeholder="Supplier Name" value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                        <Input placeholder="Contact Person" value={newSupplier.contactName || ''} onChange={e => setNewSupplier({ ...newSupplier, contactName: e.target.value })} />
                        <Input placeholder="Email" value={newSupplier.email || ''} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                        <Input placeholder="Phone" value={newSupplier.phone || ''} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                    </div>
                    <Input placeholder="Address" className="mb-4" value={newSupplier.address || ''} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Save Supplier</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(supplier => (
                    <Card key={supplier.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{supplier.name}</h3>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        {supplier.contactName && <p className="text-sm text-gray-600 mb-1">👤 {supplier.contactName}</p>}
                        <div className="space-y-1 text-sm text-gray-500">
                            {supplier.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {supplier.email}</div>}
                            {supplier.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {supplier.phone}</div>}
                            {supplier.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {supplier.address}</div>}
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {supplier._count?.purchaseOrders || 0} Orders
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
