import React from 'react';
import { NavLink } from 'react-router-dom';

export function BottomNav() {
    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { icon: 'list_alt', label: 'Orders', path: '/admin/orders' },
        { icon: 'table_bar', label: 'Tables', path: '/admin/tables' },
        { icon: 'query_stats', label: 'Insights', path: '/admin/reports' }, // mapped reports to insights icon
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#121418]/95 backdrop-blur-xl border-t border-white/5 px-4 py-2 pb-8 flex justify-around items-center z-50 transition-all duration-300">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? 'text-primary' : 'text-slate-500 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                    </span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
