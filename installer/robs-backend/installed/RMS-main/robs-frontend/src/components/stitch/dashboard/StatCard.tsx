import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendDirection?: 'up' | 'down';
    trendColor?: string; // 'text-emerald-500' or 'text-rose-500'
}

export function StatCard({ title, value, trend, trendDirection, trendColor }: StatCardProps) {
    const isUp = trendDirection === 'up';
    const defaultColor = isUp ? 'text-emerald-500' : 'text-rose-500';
    const colorClass = trendColor || defaultColor;
    const icon = isUp ? 'trending_up' : 'trending_down';

    return (
        <div className="flex-none w-40 p-4 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">{title}</p>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-foreground">{value}</span>
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold mt-2`}>
                    <span className="material-symbols-outlined text-xs">{icon}</span>
                    {trend}
                </div>
            )}
        </div>
    );
}
