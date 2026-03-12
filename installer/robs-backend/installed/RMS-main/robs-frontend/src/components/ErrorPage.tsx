import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Power } from 'lucide-react';

interface ErrorPageProps {
    onRestart: () => void;
    error?: Error;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ onRestart, error }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-red-50 p-4 text-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
                <div className="bg-red-600 p-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">System Error</h1>
                    <p className="text-red-100 mt-2 text-sm">The application encountered a critical failure.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            We couldn't recover your session automatically. Please restart the system to restore functionality.
                        </p>
                    </div>

                    {process.env.NODE_ENV === 'development' && error && (
                        <div className="bg-gray-100 p-3 rounded text-left overflow-auto max-h-32">
                            <p className="text-xs font-mono text-red-600 break-words">{error.message}</p>
                            {error.stack && <pre className="text-[10px] items-center text-gray-500 mt-1">{error.stack.split('\n')[1]}</pre>}
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            onClick={onRestart}
                            className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                        >
                            <Power className="mr-2 h-5 w-5" />
                            Restart System
                        </Button>

                        <p className="mt-4 text-xs text-gray-400">
                            Error Code: 0xCRITICAL_FAILURE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
