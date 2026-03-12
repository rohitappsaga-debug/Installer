
import { useState, useEffect, useRef } from 'react';
import { Database, Plus, Loader2, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, Terminal, Info, Settings2, Lock, User, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPgStatus, configureDb } from '../../api';

interface AutoInstallResult {
    ok: boolean;
    code: string;
    message: string;
    details?: string;
    nextStep?: string;
    credentials?: any;
}

export default function DatabaseStep({ onNext }: { onNext: () => void }) {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [installResult, setInstallResult] = useState<AutoInstallResult | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);
    const terminalBodyRef = useRef<HTMLDivElement>(null);
    const orchestrationRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'root',
        database: 'rms',
        rootUser: 'postgres',
        rootPassword: ''
    });

    const [connError, setConnError] = useState('');
    const [testing, setTesting] = useState(false);

    const refreshStatus = () => {
        setLoading(true);
        getPgStatus().then(res => {
            setStatus(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    useEffect(() => {
        if (status?.installed && !installResult && !installing && !loading) {
            handleAutoInstall();
        }
    }, [status, loading]);

    useEffect(() => {
        // Scroll only within the terminal container, not the whole page
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [logs]);

    // Scroll the orchestration card into view when installing starts
    useEffect(() => {
        if (installing && orchestrationRef.current) {
            orchestrationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [installing]);

    const handleAutoInstall = async () => {
        setInstalling(true);
        setInstallResult(null);
        setConnError('');
        setLogs(['[SYSTEM] Initializing premium setup sequence...']);

        const params = new URLSearchParams({
            database: config.database,
            user: config.user,
            password: config.password,
            rootUser: config.rootUser,
            rootPassword: config.rootPassword
        });

        const eventSource = new EventSource(`/api/install/postgres/auto-setup/stream?${params.toString()}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
                setLogs(prev => [...prev, data.message]);
            } else if (data.type === 'complete') {
                eventSource.close();
                setInstalling(false);
                const result: AutoInstallResult = data;
                setInstallResult(result);

                if (result.ok && result.credentials) {
                    const creds = result.credentials;
                    setConfig(prev => ({
                        ...prev,
                        host: creds.host,
                        port: creds.port,
                        user: creds.user,
                        password: creds.password,
                        database: creds.database,
                        rootUser: creds.rootUser || prev.rootUser,
                        rootPassword: creds.rootPassword || prev.rootPassword
                    }));
                    setStatus({ installed: true, version: 'Auto-provisioned' });

                    // Auto-proceed logic: 2s delay
                    setTimeout(() => {
                        onNext();
                    }, 2000);
                }
            } else if (data.type === 'error') {
                eventSource.close();
                setInstalling(false);
                setInstallResult({
                    ok: false,
                    code: data.code || 'UNKNOWN_ERROR',
                    message: data.message || 'Setup failed during streaming.'
                });
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setInstalling(false);
            setInstallResult({
                ok: false,
                code: 'NETWORK_ERROR',
                message: 'Lost connection to installer backend.',
                nextStep: 'Ensure the backend server is running on port 3005.'
            });
        };
    };

    const handleConfigure = async () => {
        setTesting(true);
        setConnError('');
        try {
            await configureDb(config);
            onNext();
        } catch (err: any) {
            setConnError(err.response?.data?.details || err.message || 'Database connection failed.');
        } finally {
            setTesting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            >
                <div className="relative">
                    <Database className="w-16 h-16 text-blue-500/20" />
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin absolute inset-0" />
                </div>
            </motion.div>
            <p className="mt-6 text-gray-400 font-medium animate-pulse">Scanning infrastructure...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-12"
        >
            <header className="relative">
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-3">
                    Database <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Configuration</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl">
                    Deploying the backbone of your restaurant management system. Choose between our automated orchestration or manual setup.
                </p>
            </header>

            {/* Orchestration Card */}
            <div ref={orchestrationRef} className={`glass-card p-1 overflow-hidden transition-all duration-500 ${status?.installed ? 'shadow-green-500/5' : 'shadow-blue-500/5'}`}>
                <div className="p-6">
                    <div className="flex items-start gap-6">
                        <div className={`p-4 rounded-2xl ${status?.installed ? 'bg-green-500/10' : 'bg-blue-500/10'} border border-white/5 shadow-inner`}>
                            <Database className={status?.installed ? "text-green-400" : "text-blue-400"} size={32} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-white">
                                    {status?.installed ? 'PostgreSQL Instance Detected' : 'Automated Orchestration'}
                                </h3>
                                <AnimatePresence>
                                    {status?.installed && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30"
                                        >
                                            Ready
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                {status?.installed
                                    ? `A local PostgreSQL environment (${status.version}) was successfully discovered. We recommend using our auto-provisioning for optimal compatibility.`
                                    : 'No active PostgreSQL instance found. Our intelligent installer will handle the installation, security configuration, and provisioning for you.'}
                            </p>

                            {!installing && !installResult && (
                                <button
                                    onClick={handleAutoInstall}
                                    className="premium-button group flex items-center gap-3 px-6 py-3"
                                >
                                    {status?.installed ? (
                                        <>
                                            <Settings2 size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                            <span>Start Auto-Provisioning</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                            <span>Install & Provision Now</span>
                                        </>
                                    )}
                                </button>
                            )}

                            <AnimatePresence>
                                {(installing || (installResult && !installResult.ok) || logs.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-3 text-blue-400 font-bold tracking-tight">
                                            {installing && <Loader2 className="animate-spin" size={18} />}
                                            <span className="text-sm uppercase tracking-widest">
                                                {installing ?
                                                    (status?.installed ? 'Provisioning Environment...' : 'Executing Installation Pipeline...') :
                                                    'Installation Logs'}
                                            </span>
                                        </div>

                                        <div className="bg-[#0d1117]/90 rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[280px]">
                                            <header className="bg-[#161b22] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono font-bold uppercase tracking-tighter">
                                                    <Terminal size={14} />
                                                    <span>provisioning.log</span>
                                                </div>
                                            </header>

                                            <div ref={terminalBodyRef} className="flex-1 overflow-y-auto p-5 font-mono text-[12px] leading-relaxed terminal-scrollbar bg-black/40">
                                                {logs.map((log, i) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        key={i}
                                                        className="flex gap-4 mb-1.5"
                                                    >
                                                        <span className="text-gray-700 select-none w-4 text-right">{i + 1}</span>
                                                        <span className={
                                                            log.includes('[ERROR]') ? 'text-red-400 font-bold' :
                                                                log.includes('[SYSTEM]') ? 'text-cyan-400 font-bold' :
                                                                    'text-gray-300'
                                                        }>
                                                            {log}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                                {installing && (
                                                    <div className="flex gap-2 items-center text-cyan-400 animate-pulse mt-2">
                                                        <span className="font-bold underline decoration-2">{'>'}</span>
                                                        <div className="w-2 h-4 bg-cyan-400/80 rounded-sm"></div>
                                                    </div>
                                                )}
                                                <div ref={logEndRef} />
                                            </div>

                                            <footer className="bg-[#161b22] px-5 py-3 flex items-center gap-2 border-t border-white/5">
                                                <Info size={14} className="text-blue-500" />
                                                <span className="text-[11px] text-gray-500 font-medium italic">
                                                    {installing ? 'Crucial setup in progress. Please refrain from refreshing.' : 'Execution finished.'}
                                                </span>
                                            </footer>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Enhanced Result Cards */}
                            <AnimatePresence>
                                {installResult && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-6"
                                    >
                                        {!installResult.ok ? (
                                            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
                                                        <ShieldAlert size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-red-200 mb-1 leading-tight">{installResult.message}</h4>
                                                        <p className="text-sm text-red-300/60 mb-6 leading-relaxed">
                                                            {installResult.nextStep || 'Advanced diagnostics required. Check log output for specific error codes.'}
                                                        </p>

                                                        {installResult.code === 'AUTH_FAILED' && (
                                                            <div className="bg-black/20 p-5 rounded-2xl border border-white/5 mb-6 space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Root User</label>
                                                                        <input
                                                                            type="text"
                                                                            value={config.rootUser}
                                                                            onChange={e => setConfig({ ...config, rootUser: e.target.value })}
                                                                            className="w-full glass-input p-3 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Root Password</label>
                                                                        <input
                                                                            type="password"
                                                                            value={config.rootPassword}
                                                                            onChange={e => setConfig({ ...config, rootPassword: e.target.value })}
                                                                            className="w-full glass-input p-3 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={handleAutoInstall}
                                                                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/40"
                                                                >
                                                                    Elevate Credentials
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={handleAutoInstall}
                                                                className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 transition-colors"
                                                            >
                                                                Retry Procedure
                                                            </button>
                                                            <button
                                                                onClick={() => setInstallResult(null)}
                                                                className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-lg hover:bg-white/10 border border-white/5 transition-colors"
                                                            >
                                                                Manual Override
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-5">
                                                <div className="p-3 bg-green-500/20 rounded-full text-green-400 shadow-lg shadow-green-500/10">
                                                    <CheckCircle2 size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-green-200">System Provisioned Successfully</h4>
                                                    <p className="text-sm text-green-300/60 font-medium">All connection security parameters have been auto-injected below.</p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className={`transition-all duration-700 ${installing ? 'hidden' : 'opacity-100 scale-100'}`}>
                <div className="glass-card overflow-hidden">
                    <div className="p-8 space-y-10">
                        <header className="flex items-end justify-between border-b border-white/5 pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    <Server size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Instance Topology</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">Backend Connectivity</h3>
                            </div>
                            <span className="text-xs text-gray-500 font-medium italic">Adjust only if using non-standard nodes</span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] transition-colors group-focus-within:text-blue-400">
                                        <Server size={12} /> Host Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        value={config.host}
                                        onChange={e => setConfig({ ...config, host: e.target.value })}
                                        className="w-full glass-input p-4 text-white font-medium shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] transition-colors group-focus-within:text-blue-400">
                                        <Plus size={12} /> Communication Port
                                    </label>
                                    <input
                                        type="number"
                                        value={config.port}
                                        onChange={e => setConfig({ ...config, port: parseInt(e.target.value) })}
                                        className="w-full glass-input p-4 text-white font-mono shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 bg-white/[0.01] p-6 rounded-2xl border border-white/[0.03]">
                                <div className="space-y-2 group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] transition-colors group-focus-within:text-blue-400">
                                        <Database size={12} /> Database Identifier
                                    </label>
                                    <input
                                        type="text"
                                        value={config.database}
                                        onChange={e => setConfig({ ...config, database: e.target.value })}
                                        className="w-full glass-input p-4 text-white font-semibold"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] transition-colors group-focus-within:text-blue-400">
                                        <User size={12} /> User Principal
                                    </label>
                                    <input
                                        type="text"
                                        value={config.user}
                                        onChange={e => setConfig({ ...config, user: e.target.value })}
                                        className="w-full glass-input p-4 text-white font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] transition-colors group-focus-within:text-blue-400 ml-1">
                                <Lock size={12} /> Security Access Token
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={config.password}
                                    onChange={e => setConfig({ ...config, password: e.target.value })}
                                    className="w-full glass-input p-4 pr-12 text-white shadow-inner bg-gradient-to-r from-black/40 to-black/20"
                                    placeholder="Enter secure password"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
                            </div>
                        </div>

                        {!status?.installed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-4"
                            >
                                <ShieldAlert size={20} className="text-amber-500 mt-1 flex-shrink-0" />
                                <div className="space-y-4 flex-1">
                                    <p className="text-[12px] text-amber-200/60 leading-relaxed font-medium">
                                        Existing Instance Detected? Provisioning requires superuser (e.g. 'postgres') clearance. Provide these once to finalize the secure pipeline.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Root ID"
                                            value={config.rootUser}
                                            onChange={e => setConfig({ ...config, rootUser: e.target.value })}
                                            className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-amber-500/30 outline-none transition-colors"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Root Key"
                                            value={config.rootPassword}
                                            onChange={e => setConfig({ ...config, rootPassword: e.target.value })}
                                            className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-amber-500/30 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {connError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200"
                                >
                                    <AlertCircle className="flex-shrink-0 text-red-500" size={24} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">Connectivity Failure</p>
                                        <p className="text-xs opacity-70 leading-relaxed">{connError}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="bg-white/[0.02] px-8 py-6 flex items-center justify-between border-t border-white/5">
                        <button
                            onClick={refreshStatus}
                            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Loader2 className={loading ? 'animate-spin' : ''} size={14} />
                            Re-scan Node
                        </button>
                        <button
                            onClick={handleConfigure}
                            disabled={testing || (!config.password && !installResult?.ok)}
                            className="premium-button group flex items-center gap-4 px-10 py-4 text-lg"
                        >
                            {testing ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Validate & Continue</span>
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={24} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
