import React, { useState } from 'react';
import { Order } from '../../types';
import { LiveOrderCard } from '../stitch/dashboard/LiveOrderCard';
import { Search, Filter } from 'lucide-react';

interface OrdersPageProps {
    orders: Order[];
}

export function OrdersPage({ orders }: OrdersPageProps) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredOrders = orders.filter(order => {
        if (filter !== 'all' && order.status !== filter) return false;
        if (search && !order.orderNumber.toString().includes(search) && !order.tableNumber?.toString().includes(search)) return false;
        return true;
    });

    const activeOrders = filteredOrders.filter(o => !['completed', 'cancelled', 'served'].includes(o.status));
    const completedOrders = filteredOrders.filter(o => ['completed', 'cancelled', 'served'].includes(o.status));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Orders</h1>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-9 pr-4 py-2 bg-card/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="p-2 bg-card/50 border border-white/10 rounded-xl hover:bg-white/5">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['all', 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === status
                            ? 'bg-primary text-white'
                            : 'bg-card/30 text-slate-400 hover:text-white hover:bg-card/50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Active Orders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeOrders.map(order => (
                            <LiveOrderCard
                                key={order.id}
                                order={order}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Completed Orders Section */}
            {completedOrders.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 mt-8">Past Orders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedOrders.map(order => (
                            <LiveOrderCard
                                key={order.id}
                                order={order}
                            />
                        ))}
                    </div>
                </section>
            )}

            {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No orders found matching your criteria.
                </div>
            )}
        </div>
    );
}
