import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from './ErrorPage';
import { settingsAPI } from '../services/api';
import { Loader2 } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    isRecovering: boolean;
    recoveryAttempt: number;
}

const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_TIMEOUT_MS = 15000;
const INITIAL_RECOVERY_DELAY_MS = 2000;

export class GlobalErrorBoundary extends Component<Props, State> {
    private recoveryTimer: NodeJS.Timeout | null = null;
    private maxDurationTimer: NodeJS.Timeout | null = null;

    public state: State = {
        hasError: false,
        isRecovering: false,
        recoveryAttempt: 0,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, isRecovering: true, recoveryAttempt: 0 };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Start auto-recovery process if not already recovering
        if (this.state.isRecovering && this.state.recoveryAttempt === 0) {
            this.startRecovery();
        }
    }

    public componentDidMount() {
        // Listen for unhandled promise rejections (network failures etc.)
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }

    public componentWillUnmount() {
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        this.clearTimers();
    }

    private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        // We only want to catch critical failures that might break the app state
        // For now, we'll log it, but if we want to trigger the boundary, we'd need to setState.
        // However, unhandled rejections don't always mean the UI is broken.
        // We will stick to valid react errors for the full boundary, but we can restart if needed.
        console.error('Unhandled Rejection:', event.reason);

        // Optional: if we decide specific network errors should trigger a full reset
        // if (event.reason?.message?.includes('Critical')) { ... }
    };

    private clearTimers() {
        if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
        if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);
    }

    private startRecovery = () => {
        console.log('🔄 Attempting system auto-recovery...');

        // Set a hard limit for recovery (15s)
        this.maxDurationTimer = setTimeout(() => {
            if (this.state.isRecovering) {
                console.log('❌ Recovery timed out.');
                this.setState({ isRecovering: false }); // Show fatal error
            }
        }, RECOVERY_TIMEOUT_MS);

        this.attemptRecovery();
    };

    private attemptRecovery = () => {
        const { recoveryAttempt } = this.state;

        if (recoveryAttempt >= MAX_RECOVERY_ATTEMPTS) {
            console.log('❌ Max recovery attempts reached.');
            this.setState({ isRecovering: false });
            return;
        }

        this.recoveryTimer = setTimeout(async () => {
            try {
                console.log(`Checking system health (Attempt ${recoveryAttempt + 1}/${MAX_RECOVERY_ATTEMPTS})...`);
                const health = await settingsAPI.getHealth();

                if (health.success || health.status === 'healthy') {
                    console.log('✅ System healthy. Resolving...');
                    this.handleRecovered();
                } else {
                    throw new Error('System unhealthy');
                }
            } catch (e) {
                console.warn('⚠️ Recovery check failed, retrying...', e);
                this.setState(prev => ({ recoveryAttempt: prev.recoveryAttempt + 1 }), () => {
                    // Exponential backoff or simple retry
                    this.attemptRecovery();
                });
            }
        }, INITIAL_RECOVERY_DELAY_MS * (recoveryAttempt + 1));
    };


    private handleRecovered = () => {
        this.clearTimers();
        // Reset error state to try rendering children again
        this.setState({ hasError: false, isRecovering: false, error: undefined, recoveryAttempt: 0 });

        // Optionally force a reload of data here if we had a global store
        // For now, re-mounting children (App) should trigger useEffects to fetch data
    };

    private handleManualRestart = () => {
        // Hard reload
        window.location.reload();
    };

    public render() {
        const { hasError, isRecovering, error } = this.state;

        if (hasError) {
            if (isRecovering) {
                return (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-900">Attempting Recovery</h2>
                                <p className="text-gray-500">Please wait while we restore the connection...</p>
                            </div>
                        </div>
                    </div>
                );
            }

            // Fatal Error State
            return <ErrorPage onRestart={this.handleManualRestart} error={error} />;
        }

        return this.props.children;
    }
}
