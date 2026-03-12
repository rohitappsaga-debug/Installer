
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, Loader2, Globe, Package, ShieldCheck } from 'lucide-react';
import { checkSystem } from '../../api';

// ─── API Response Types ────────────────────────────────────────────────────────

interface PortResult {
    value: number;
    status: 'free' | 'busy';
    message: string;
}

interface CheckStatus {
    ok: boolean;
    message: string;
}

interface SystemCheckResponse {
    nodeVersion: string;
    platform: string;
    hasWriteAccess: boolean;
    port: PortResult;
    internet: CheckStatus;
    packageManager: CheckStatus & { manager?: string };
    admin: CheckStatus;
    errors: string[];
    warnings: string[];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface RequirementItemProps {
    icon?: any;
    label: string;
    value: string;
    passed: boolean;
    isWarning?: boolean;
    detail?: string;
}

const RequirementItem = ({ icon: Icon, label, value, passed, isWarning = false, detail }: RequirementItemProps) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-700/50 last:border-0">
        <div className="flex items-center gap-3 flex-1">
            {Icon && <Icon className="w-5 h-5 text-gray-500" />}
            <div>
                <span className="text-gray-300 font-medium">{label}</span>
                {detail && (
                    <p className={`text-sm mt-0.5 ${isWarning ? 'text-amber-400' : 'text-gray-400'}`}>
                        {detail}
                    </p>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
            <span className={`text-sm font-medium ${passed ? 'text-green-400' : isWarning ? 'text-amber-400' : 'text-red-400'}`}>
                {value}
            </span>
            {passed
                ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                : isWarning
                    ? <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            }
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

interface RequirementsStepProps {
    onNext: () => void;
}

export default function RequirementsStep({ onNext }: RequirementsStepProps) {
    const [loading, setLoading] = useState(true);
    const [rechecking, setRechecking] = useState(false);
    const [results, setResults] = useState<SystemCheckResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRequirements = async (isRecheck = false) => {
        if (isRecheck) setRechecking(true);
        else setLoading(true);
        setError(null);

        try {
            const response = await checkSystem();
            setResults(response.data);
        } catch (err) {
            setError('Failed to check system requirements. Please ensure the installer server is running.');
        } finally {
            setLoading(false);
            setRechecking(false);
        }
    };

    useEffect(() => { fetchRequirements(); }, []);

    // ── Derived state ──────────────────────────────────────────────────────────

    const portFree = results?.port.status === 'free';
    const portValue = results?.port.value;
    const portLabel = portValue != null ? `Port ${portValue} (Backend API)` : 'Backend Port';

    const hasBlockingErrors = (results?.errors?.length ?? 0) > 0;
    const canProceed = !loading && !rechecking && !error && !hasBlockingErrors && portFree;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-400">Verifying system environment…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Check Failed</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={() => fetchRequirements(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">System Requirements</h2>
            <p className="text-gray-400 mb-6">
                We're checking if your system is ready for the restaurant management system.
            </p>

            <div className="bg-gray-800/40 rounded-xl border border-gray-700 overflow-hidden mb-6">
                <div className="p-1 divide-y divide-gray-700/50">
                    {/* Node.js */}
                    <RequirementItem
                        label="Node.js Version"
                        value={results?.nodeVersion ?? '—'}
                        passed={(results?.errors ?? []).every(e => !e.includes('Node.js'))}
                        detail="Required: >= v18"
                    />

                    {/* Internet */}
                    <RequirementItem
                        icon={Globe}
                        label="Internet Connection"
                        value={results?.internet.ok ? 'Connected' : 'Offline'}
                        passed={results?.internet.ok ?? false}
                        isWarning={!results?.internet.ok}
                        detail={results?.internet.message}
                    />

                    {/* Admin */}
                    <RequirementItem
                        icon={ShieldCheck}
                        label="Administrator Rights"
                        value={results?.admin.ok ? 'Full' : 'Limited'}
                        passed={results?.admin.ok ?? false}
                        isWarning={!results?.admin.ok}
                        detail={results?.admin.message}
                    />

                    {/* Package Manager */}
                    <RequirementItem
                        icon={Package}
                        label="Package Manager"
                        value={results?.packageManager.manager || 'None'}
                        passed={results?.packageManager.ok ?? false}
                        isWarning={!results?.packageManager.ok}
                        detail={results?.packageManager.message}
                    />

                    {/* Port */}
                    <RequirementItem
                        label={portLabel}
                        value={portFree ? 'Available' : 'Busy'}
                        passed={portFree}
                        isWarning={!portFree}
                        detail={results?.port.message}
                    />

                    {/* Write Access */}
                    <RequirementItem
                        label="Write Permissions"
                        value={results?.hasWriteAccess ? 'Granted' : 'Denied'}
                        passed={results?.hasWriteAccess ?? false}
                    />
                </div>
            </div>

            {/* Issues Found */}
            {(hasBlockingErrors || !portFree) && (
                <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                            <p className="text-red-400 font-semibold text-sm mb-1">Blocking Issues:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {results?.errors?.map((err, i) => (
                                    <li key={i} className="text-red-300/80 text-xs">{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Warnings */}
            {(results?.warnings?.length ?? 0) > 0 && (
                <div className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-amber-400 font-semibold text-sm mb-1">Attention Required:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {results?.warnings?.map((w, i) => (
                                    <li key={i} className="text-amber-300/80 text-xs">{w}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <button
                    onClick={() => fetchRequirements(true)}
                    disabled={rechecking}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    {rechecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Re-check
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={onNext}
                        disabled={!canProceed}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                    >
                        Continue Setup
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
