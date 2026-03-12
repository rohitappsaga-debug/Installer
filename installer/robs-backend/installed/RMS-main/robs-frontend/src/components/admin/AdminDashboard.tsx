import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Order } from '../../types';
import { StatCard } from '../stitch/dashboard/StatCard';
import { HourlyChart } from '../stitch/dashboard/HourlyChart';
import { LiveOrderCard } from '../stitch/dashboard/LiveOrderCard';
import { reportsAPI } from '../../services/api';

interface AdminDashboardProps {
  tables: Table[];
  orders: Order[];
  currency: string;
}

export function AdminDashboard({ tables, orders, currency }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [yesterdayMetrics, setYesterdayMetrics] = useState<{ sales: number; orders: number } | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await reportsAPI.getDailySales(7);
        // Find yesterday's data
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Ensure data is array and find
        if (Array.isArray(data)) {
          const yesterdayData = data.find((d: any) => d.date.startsWith(yesterdayStr));
          if (yesterdayData) {
            setYesterdayMetrics({ sales: yesterdayData.totalSales, orders: yesterdayData.totalOrders });
          }
        }
      } catch (error) {
        console.error('Failed to fetch sales trends:', error);
      }
    };
    fetchTrends();
  }, []);

  // Calculate Today's Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrdersList = orders.filter(order => order.createdAt.startsWith(todayStr));

  const todaySales = todayOrdersList.reduce((sum, order) => sum + order.total, 0);
  const todayOrdersCount = todayOrdersList.length;

  const calculateActiveTables = () => tables.filter(t => t.status === 'occupied').length;
  const activeTables = calculateActiveTables();

  const pendingOrders = orders.filter(o => !['delivered', 'served', 'completed', 'cancelled'].includes(o.status));

  // Calculate trends
  const revenueTrend = yesterdayMetrics?.sales
    ? ((todaySales - yesterdayMetrics.sales) / yesterdayMetrics.sales) * 100
    : 0;

  const ordersTrend = yesterdayMetrics?.orders
    ? ((todayOrdersCount - yesterdayMetrics.orders) / yesterdayMetrics.orders) * 100
    : 0;

  const occupancyRate = tables.length > 0 ? (activeTables / tables.length) * 100 : 0;

  // Hourly Volume Calculation
  const hourlyData = new Array(24).fill(0);
  todayOrdersList.forEach(order => {
    const d = new Date(order.createdAt);
    const hour = d.getHours();
    if (hour >= 0 && hour < 24) {
      hourlyData[hour] += order.total;
    }
  });

  const maxVolume = Math.max(...hourlyData, 0);
  const peakHourIndex = hourlyData.indexOf(maxVolume);
  const peakHourStr = maxVolume > 0 ? `${peakHourIndex.toString().padStart(2, '0')}:00` : '--:--';

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <section className="mt-4">
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
          <StatCard
            title="Daily Revenue"
            value={`${currency}${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend={`${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`}
            trendDirection={revenueTrend >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Today Orders"
            value={todayOrdersCount.toString()}
            trend={`${ordersTrend > 0 ? '+' : ''}${ordersTrend.toFixed(1)}%`}
            trendDirection={ordersTrend >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Active Tables"
            value={activeTables.toString()}
            trend={`${Math.round(occupancyRate)}% Occupancy`}
            trendDirection="up"
            trendColor="text-blue-500"
          />
        </div>
      </section>

      {/* Hourly Volume Chart */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Hourly Volume</h2>
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full uppercase">Peak Hour: {peakHourStr}</span>
        </div>
        <HourlyChart data={hourlyData} />
      </section>

      {/* Live Orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Live Orders ({pendingOrders.length})</h2>
          <button
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
            onClick={() => navigate('/admin/orders')}
          >
            View All <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="space-y-3">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card/30 rounded-xl border border-border">
              No active orders
            </div>
          ) : (
            pendingOrders.map(order => (
              <LiveOrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
