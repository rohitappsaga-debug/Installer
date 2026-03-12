import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ordersAPI, usersAPI } from '../../services/api';
import { Order, User, UserRole } from '../../types';

export function DeliveryDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch delivery orders (could filter by type if API supported, but we check deliveryDetails field)
            // Actually getAll doesn't filter by 'Delivery' per se, but we can filter client side or add query param later.
            const ordersResp = await ordersAPI.getAll(1, 100);
            if (ordersResp.success) {
                // Filter orders that have deliveryDetails
                const deliveryOrders = ordersResp.data.filter((o: Order) => !!o.deliveryDetails);
                setOrders(deliveryOrders);
            }

            // Fetch drivers
            const usersResp = await usersAPI.getAll(1, 100);
            if (usersResp.success) {
                setDrivers(usersResp.data.filter((u: User) => u.role === 'delivery'));
            }
        } catch (e) {
            toast.error('Failed to load delivery data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: any) => {
        try {
            const resp = await ordersAPI.updateStatus(id, status);
            if (resp.success) {
                toast.success('Status updated');
                loadData();
            } else {
                toast.error('Failed');
            }
        } catch (e) {
            toast.error('Error updating status');
        }
    };

    const handleAssignDriver = async (orderId: string, driverId: string) => {
        // Need API to assign driver. `updateOrder`?
        // `deliveryDetails` is complex. `ordersAPI.update` does not deeply update relations easily with mock implementation?
        // Wait, backend `orders.ts` `updateOrder` (PUT /:id) takes `...req.body`.
        // Does it update `deliveryDetails`?
        // Prisma `update` doesn't deeply merge?
        // This might be missing in Backend `updateOrder`.
        // I'll show a toast for now or try to update.
        toast.info('Driver assignment not fully implemented in API yet.');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h2>
                    <p className="text-gray-500">Manage delivery orders and drivers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                                <p className="text-sm text-gray-500">{new Date(order.createdAt!).toLocaleTimeString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="font-medium">Customer:</p>
                            <p>{order.deliveryDetails?.customerName} ({order.deliveryDetails?.customerPhone})</p>
                            <p className="text-gray-600 text-sm mt-1">{order.deliveryDetails?.address}</p>
                        </div>

                        <div className="mb-4">
                            <p className="font-medium">Items:</p>
                            <ul className="text-sm text-gray-600">
                                {order.items?.map((item, idx) => (
                                    <li key={idx} className="flex justify-between">
                                        <span>{item.quantity}x {item.menuItem.name}</span>
                                        <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-2 pt-2 border-t flex justify-between font-bold">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            {order.status === 'pending' && (
                                <Button className="flex-1 bg-blue-600" onClick={() => handleStatusUpdate(order.id, 'preparing')}>Start Preparing</Button>
                            )}
                            {order.status === 'preparing' && (
                                <Button className="flex-1 bg-orange-600" onClick={() => handleStatusUpdate(order.id, 'ready')}>Mark Ready</Button>
                            )}
                            {order.status === 'ready' && (
                                <Button className="flex-1 bg-purple-600" onClick={() => handleStatusUpdate(order.id, 'delivered')}>Mark Delivered</Button>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(order.id, 'cancelled')}>Cancel</Button>
                            )}
                        </div>
                    </div>
                ))}

                {orders.length === 0 && !isLoading && (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl">
                        No delivery orders found
                    </div>
                )}
            </div>
        </div>
    );
}
