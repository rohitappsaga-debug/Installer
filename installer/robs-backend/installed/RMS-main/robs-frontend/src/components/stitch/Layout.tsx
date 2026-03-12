import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { NotificationsPanel } from '../mobile/NotificationsPanel';
import { useRealtime } from '../../contexts/RealtimeContext';
import { X } from 'lucide-react';

import { CommandPalette } from '../admin/CommandPalette';
import { useEffect } from 'react';

export function StitchLayout({ children, restaurantName }: { children: React.ReactNode; restaurantName?: string }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const { notifications, markNotificationAsRead, deleteNotification, clearAllNotifications } = useRealtime();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-display overflow-x-hidden selection:bg-primary/20 relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantName={restaurantName} />

            <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                onNotificationClick={() => setShowNotifications(true)}
                onSearchClick={() => setIsCommandOpen(true)}
                restaurantName={restaurantName}
            />

            <main className="pb-32 lg:pl-[280px] transition-all duration-300">

                <div className="p-4 lg:p-8 max-w-[1920px] mx-auto">
                    {children}
                </div>
            </main>

            <BottomNav />

            {/* Notifications Overlay */}
            {showNotifications && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setShowNotifications(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background shadow-2xl border-l border-border animate-in slide-in-from-right duration-300">
                        <NotificationsPanel
                            notifications={notifications}
                            onMarkAsRead={markNotificationAsRead}
                            onDelete={deleteNotification}
                            onClearAll={clearAllNotifications}
                            onBack={() => setShowNotifications(false)}
                        />
                    </div>
                </>
            )}

            <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} />
        </div>
    );
}
