
import React, { useEffect, useState } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '../ui/command';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Menu as MenuIcon,
    UtensilsCrossed,
    Table2,
    ClipboardList,
    BarChart3,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const runCommand = React.useCallback((command: () => unknown) => {
        onOpenChange(false);
        command();
    }, [onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search pages, orders, or actions…" />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/dashboard'))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/menu'))}>
                        <MenuIcon className="mr-2 h-4 w-4" />
                        <span>Menu</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/categories'))}>
                        <UtensilsCrossed className="mr-2 h-4 w-4" />
                        <span>Categories</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/tables'))}>
                        <Table2 className="mr-2 h-4 w-4" />
                        <span>Tables</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/orders'))}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/reports'))}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Sales Reports</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/users'))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Users</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/billing'))}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/settings'))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => runCommand(() => navigate('/admin/orders'))}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search Orders</span>
                        <CommandShortcut>⌘O</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => logout())}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
