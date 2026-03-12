import { Order, MenuItem } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportsAPI } from '../../services/api';



interface SalesReportsProps {
  orders: Order[];
  menuItems: MenuItem[];
  currency: string;
}

export function SalesReports({ orders, menuItems, currency }: SalesReportsProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [dailySales, setDailySales] = useState<Array<{ date: string; totalSales: number }>>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        let dailyData;

        if (dateRange.from && dateRange.to) {
          // Fetch custom range
          const response = await reportsAPI.getRange(
            dateRange.from.toISOString(),
            dateRange.to.toISOString()
          );
          if (response.success) {
            dailyData = response.data;
          }
        } else {
          // Default to 7 days
          const response = await reportsAPI.getDailySales(7);
          if (response.success) {
            dailyData = response.data;
          }
        }

        if (dailyData) {
          setDailySales(dailyData.map((d: any) => ({
            date: d.date,
            totalSales: Number(d.totalSales)
          })));
        }

        // Always fetch summary for cards (could be improved to be range-specific too, but keeping simple for now)
        const summaryResp = await reportsAPI.getSummary();
        if (summaryResp.success) {
          setSummary(summaryResp.data);
        }

      } catch (e) {
        console.error("Failed to fetch report data", e);
      }
    })();
  }, [dateRange]);




  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatPercentageChange = (value: number) => {
    const isPositive = value >= 0;
    return {
      text: `${isPositive ? '+' : ''}${value.toFixed(1)}% from last period`,
      color: isPositive ? 'text-emerald-500' : 'text-rose-500' // Updated to match green/red status
    };
  };

  // Calculate top selling items
  const itemSales = new Map<string, { item: MenuItem; quantity: number; revenue: number }>();
  orders.forEach(order => {
    // Filter orders if date range is active? 
    // Currently 'orders' prop comes from parent. Ideally this should be filtered too.
    // For now, let's assume 'orders' might not be filtered by the API call above, 
    // BUT typically key metrics charts come from 'dailySales'. 
    // If we want 'orders' to strictly match, we might need to fetch orders by range too.
    // However, the prompt asks to make the button work. The chart uses 'dailySales'.

    // Let's filter client-side orders for the top-items/category charts if a range is set
    const orderDate = new Date(order.createdAt);
    if (dateRange.from && dateRange.to) {
      if (orderDate < dateRange.from || orderDate > dateRange.to) return;
    }

    order.items.forEach(orderItem => {
      const existing = itemSales.get(orderItem.menuItem.id);
      if (existing) {
        existing.quantity += orderItem.quantity;
        existing.revenue += orderItem.menuItem.price * orderItem.quantity;
      } else {
        itemSales.set(orderItem.menuItem.id, {
          item: orderItem.menuItem,
          quantity: orderItem.quantity,
          revenue: orderItem.menuItem.price * orderItem.quantity,
        });
      }
    });
  });

  const topSellingItems = Array.from(itemSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Category sales
  const categorySales = new Map<string, number>();
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (dateRange.from && dateRange.to) {
      if (orderDate < dateRange.from || orderDate > dateRange.to) return;
    }

    order.items.forEach(orderItem => {
      const category = orderItem.menuItem.category;
      categorySales.set(category, (categorySales.get(category) || 0) + orderItem.menuItem.price * orderItem.quantity);
    });
  });

  const categoryChartData = Array.from(categorySales.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'];

  // Filter orders for totals as well
  const filteredOrders = orders.filter(o => {
    if (!dateRange.from || !dateRange.to) return true;
    const d = new Date(o.createdAt);
    return d >= dateRange.from && d <= dateRange.to;
  });

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;
  const totalOrders = filteredOrders.length;

  const revenueChange = summary ? calculatePercentageChange(summary.week.sales, summary.month.sales / 4) : 0;
  const ordersChange = summary ? calculatePercentageChange(summary.week.orders, summary.month.orders / 4) : 0;
  const aovChange = summary ? calculatePercentageChange(summary.week.averageOrderValue, summary.month.averageOrderValue) : 0;

  const revenuePerf = formatPercentageChange(revenueChange);
  const ordersPerf = formatPercentageChange(ordersChange);
  const aovPerf = formatPercentageChange(aovChange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze sales performance and trends</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none bg-card border-border text-foreground hover:bg-muted hover:text-foreground">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  "Select Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
              <Calendar
                mode="range"
                selected={dateRange as any} // DateRange type mismatch fix
                onSelect={(range: any) => setDateRange(range || {})}
                className="bg-popover text-popover-foreground"
              />
            </PopoverContent>
          </Popover>

        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
              <span className="text-xl font-bold text-amber-500">{currency}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-foreground">{currency}{totalSales.toFixed(2)}</div>
              <div className={`text-xs font-semibold mt-1 ${revenuePerf.color}`}>{revenuePerf.text}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
              <div className={`text-xs font-semibold mt-1 ${ordersPerf.color}`}>{ordersPerf.text}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
              <span className="text-xl font-bold text-orange-500">{currency}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Avg Order Value</div>
              <div className="text-2xl font-bold text-foreground">{currency}{averageOrderValue.toFixed(2)}</div>
              <div className={`text-xs font-semibold mt-1 ${aovPerf.color}`}>{aovPerf.text}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6 bg-card border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${currency}${value}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: any) => [`${currency}${value}`, 'Sales']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="totalSales"
                stroke="#d97706"
                strokeWidth={3}
                dot={{ fill: '#d97706', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6 bg-card border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: any) => `${currency}${(value as number).toFixed(2)}`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card className="p-0 bg-card border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rank</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity Sold</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topSellingItems.map((item, index) => (
                <tr key={item.item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20'
                      : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                      #{index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-foreground">{item.item.name}</td>
                  <td className="py-4 px-6">
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                      {item.item.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-foreground font-medium">{item.quantity}</td>
                  <td className="py-4 px-6 text-foreground font-bold">{currency}{item.revenue.toFixed(2)}</td>
                  <td className="py-4 px-6 text-muted-foreground">{currency}{item.item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tax Summary */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Tax Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">Gross Sales</div>
            <div className="text-xl font-bold text-foreground">{currency}{totalSales.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Tax (5%)</div>
            <div className="text-xl font-bold text-foreground">{currency}{(totalSales * 0.05).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">Net Sales</div>
            <div className="text-xl font-bold text-emerald-500">{currency}{(totalSales * 0.95).toFixed(2)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
