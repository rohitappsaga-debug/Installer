import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar({ isOpen, onClose, restaurantName }: { isOpen: boolean; onClose: () => void; restaurantName?: string }) {
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { icon: 'menu_book', label: 'Menu', path: '/admin/menu' },
        { icon: 'category', label: 'Categories', path: '/admin/categories' },
        { icon: 'table_bar', label: 'Tables', path: '/admin/tables' },
        { icon: 'list_alt', label: 'Orders', path: '/admin/orders' },
        { icon: 'query_stats', label: 'Sales Reports', path: '/admin/reports' },
        { icon: 'group', label: 'Users', path: '/admin/users' },
        { icon: 'payments', label: 'Billing', path: '/admin/billing' },
        { icon: 'settings', label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-md z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <aside
                className={`fixed top-0 left-0 bottom-0 w-[280px] bg-sidebar/95 backdrop-blur-2xl border-r border-white/5 z-[70] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                <div className="px-6 pt-8 pb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <span className="material-symbols-outlined text-white text-2xl">restaurant</span>
                            </div>
                            <div>
                                <span className="block font-bold text-xl tracking-tight text-foreground leading-none">{restaurantName || 'The Grill House'}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 block">Management Space</span>
                            </div>
                        </div>
                        <button className="p-2 -mr-2 text-muted-foreground active:scale-90 transition-transform lg:hidden" onClick={onClose}>
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 no-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-5 py-3.5 rounded-full transition-all ${isActive
                                    ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20 shadow-glow-sm'
                                    : 'text-zinc-800 dark:text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                }`
                            }
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                            }}
                        >
                            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {item.icon}
                            </span>
                            <span className="font-semibold text-[15px]">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="p-6 mb-8">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-muted/50 text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/10"
                    >
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                        <span className="font-bold text-[15px]">Logout</span>
                    </button>

                    <div className="mt-8 flex items-center gap-4 px-2">
                        <img
                            alt="Profile"
                            className={`size-11 rounded-full border-2 border-white/10`}
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`}
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase mt-0.5">{user?.role || 'Administrator'}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
