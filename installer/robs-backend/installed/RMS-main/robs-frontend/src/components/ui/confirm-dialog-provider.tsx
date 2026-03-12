import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './alert-dialog';

interface ConfirmOptions {
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        description: '',
        confirmText: 'Continue',
        cancelText: 'Cancel',
        variant: 'default',
    });
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions({
            confirmText: 'Continue',
            cancelText: 'Cancel',
            variant: 'default',
            ...opts,
        });
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setOpen(false);
        resolver.current?.(true);
    };

    const handleCancel = () => {
        setOpen(false);
        resolver.current?.(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && open) {
            // If closing via properties other than buttons (like ESC), treat as cancel
            handleCancel();
        }
        setOpen(newOpen);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {options.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>{options.cancelText}</AlertDialogCancel>
                        <AlertDialogAction
                            className={options.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                            onClick={handleConfirm}
                        >
                            {options.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
