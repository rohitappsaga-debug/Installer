import { useState } from 'react';
import { MenuItem } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { menuAPI } from '../../services/api';
import { toast } from 'sonner';

interface MenuAvailabilityManagerProps {
    menuItems: MenuItem[];
}

export function MenuAvailabilityManager({ menuItems }: MenuAvailabilityManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleAvailability = async (id: string) => {
        try {
            setTogglingId(id);
            const response = await menuAPI.toggleAvailability(id);
            if (response.success) {
                toast.success(`Availability updated for ${response.data.name}`);
            } else {
                toast.error('Failed to update availability');
            }
        } catch (error) {
            console.error('Toggle availability error:', error);
            toast.error('Error updating availability');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {categories.map(category => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="whitespace-nowrap"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                    <Card key={item.id} className={`p-4 flex flex-col justify-between border-2 ${item.available ? 'border-border' : 'border-red-500/50 bg-red-50/10'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <Badge className={`h-6 ${item.available ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white border-0`}>
                                {item.available ? 'Available' : 'Unavailable'}
                            </Badge>
                        </div>

                        <Button
                            variant={item.available ? 'outline' : 'default'}
                            className={`w-full h-12 text-base font-bold transition-all ${item.available
                                ? 'hover:bg-red-500 hover:text-white hover:border-red-600'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            onClick={() => handleToggleAvailability(item.id)}
                            disabled={togglingId === item.id}
                        >
                            {togglingId === item.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                            ) : item.available ? (
                                <>
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Mark Unavailable
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Mark Available
                                </>
                            )}
                        </Button>
                    </Card>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No menu items found matching your filters.</p>
                </div>
            )}
        </div>
    );
}
