import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';

export function Header({ onMenuClick, onNotificationClick, onSearchClick, restaurantName }: { onMenuClick: () => void; onNotificationClick: () => void; onSearchClick: () => void; restaurantName?: string }) {
    const { user } = useAuth();
    const { unreadNotifications } = useRealtime();

    return (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between transition-all duration-300 lg:pl-[300px]">
            <div className="flex items-center gap-4">
                <button
                    className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors cursor-pointer lg:hidden"
                    onClick={onMenuClick}
                >
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </button>
                <div>
                    <h1 className="text-sm font-bold leading-none text-foreground">{restaurantName || 'The Grill House'}</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Terminal 04</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    onClick={onSearchClick}
                >
                    <span className="material-symbols-outlined text-xl">search</span>
                </button>
                <button
                    className="p-2 rounded-full hover:bg-muted transition-colors relative"
                    onClick={onNotificationClick}
                >
                    <span className="material-symbols-outlined text-xl">notifications</span>
                    {unreadNotifications > 0 && (
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            </div>
        </header>
    );
}
