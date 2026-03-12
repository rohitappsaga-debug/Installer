import React from 'react';
import { Order } from '../../../types';

interface LiveOrderCardProps {
    order: Order;
    onClick?: () => void;
}

export function LiveOrderCard({ order, onClick }: LiveOrderCardProps) {
    // Determine status color and text
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'text-emerald-500 bg-emerald-500/10';
            case 'preparing': return 'text-orange-500 bg-orange-500/10';
            case 'pending': return 'text-blue-500 bg-blue-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    const statusColor = getStatusColor(order.status);
    const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

    return (
        <div
            className="group relative overflow-hidden bg-card text-card-foreground border border-border rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer hover:bg-muted/50"
            onClick={onClick}
        >
            <div className={`size-12 rounded-lg ${statusColor.split(' ')[1]} flex flex-col items-center justify-center ${statusColor.split(' ')[0]} shrink-0`}>
                <span className="text-[10px] font-bold leading-none">TBL</span>
                <span className="text-lg font-black leading-none">{order.tableNumber || '?'}</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-sm truncate">Order #{order.orderNumber}</h3>
                    <span className={`text-[10px] font-bold ${statusColor} px-2 py-0.5 rounded uppercase`}>
                        {order.status}
                    </span>
                </div>

                <p className="text-xs text-slate-400 truncate">
                    {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                </p>

                <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {elapsedMinutes}m elapsed
                    </span>
                </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-active:opacity-100 transition-opacity"></div>
        </div>
    );
}
