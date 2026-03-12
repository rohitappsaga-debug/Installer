import React from 'react';

export function HourlyChart({ data }: { data: number[] }) {
    const max = Math.max(...(data || []), 1);

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-end justify-between h-32 gap-1.5">
                {Array.from({ length: 24 }).map((_, i) => {
                    const value = data?.[i] || 0;
                    const height = Math.max((value / max) * 100, 4); // Min height 4% for visibility
                    const isPeak = value === max && value > 0;

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 ease-out ${isPeak
                                        ? 'bg-primary shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                        : 'bg-muted hover:bg-primary/60'
                                    }`}
                                style={{ height: `${height}%` }}
                            ></div>

                            {/* Simple tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-border whitespace-nowrap">
                                {i.toString().padStart(2, '0')}:00 • {value.toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium px-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
            </div>
        </div>
    );
}
