import { CreateOrderRequest } from '../types';

const STORAGE_KEYS = {
    PENDING_ORDERS: 'robs_pending_orders',
};

interface OfflineOrder extends CreateOrderRequest {
    tempId: string;
    createdAt: string;
}

export const offlineStorage = {
    saveOrder: (order: CreateOrderRequest) => {
        const orders = offlineStorage.getPendingOrders();
        const newOrder: OfflineOrder = {
            ...order,
            tempId: `offline_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        orders.push(newOrder);
        localStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders));
        return newOrder;
    },

    getPendingOrders: (): OfflineOrder[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PENDING_ORDERS);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to parse offline orders', e);
            return [];
        }
    },

    removeOrder: (tempId: string) => {
        const orders = offlineStorage.getPendingOrders();
        const filtered = orders.filter(o => o.tempId !== tempId);
        localStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(filtered));
    },

    clearAll: () => {
        localStorage.removeItem(STORAGE_KEYS.PENDING_ORDERS);
    },
};
