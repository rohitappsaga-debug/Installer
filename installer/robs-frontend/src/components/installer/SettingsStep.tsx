
import { useState } from 'react';
import { ArrowRight, Loader2, HelpCircle, X, ExternalLink } from 'lucide-react';
import { saveSettings } from '../../api';

export default function SettingsStep({ onNext }: { onNext: () => void }) {
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [form, setForm] = useState({
        appName: 'Restaurant System',
        appUrl: 'http://localhost:3000',
        adminEmail: 'admin@restaurant.com',
        adminPassword: '',
        pusherAppId: '',
        pusherKey: '',
        pusherSecret: '',
        pusherCluster: 'mt1'
    });

    const validateUrl = (url: string) => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateUrl(form.appUrl)) {
            alert('Please enter a valid App URL starting with http:// or https://');
            return;
        }

        setLoading(true);
        try {
            await saveSettings(form);
            onNext();
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto relative">
            <h2 className="text-2xl font-bold mb-6 text-white">Application Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-800 p-6 rounded-lg space-y-4 shadow-xl border border-gray-700">
                    <h3 className="font-medium text-white pb-2 border-b border-gray-700">General Settings</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="App Name" value={form.appName} onChange={(v: string) => setForm({ ...form, appName: v })} />
                        <Input label="App URL" value={form.appUrl} onChange={(v: string) => setForm({ ...form, appUrl: v })} />
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg space-y-4 shadow-xl border border-gray-700">
                    <h3 className="font-medium text-white pb-2 border-b border-gray-700">Admin Account</h3>
                    <p className="text-xs text-gray-400">will be created as the initial super-admin</p>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Admin Email" type="email" value={form.adminEmail} onChange={(v: string) => setForm({ ...form, adminEmail: v })} />
                        <Input label="Admin Password" type="password" value={form.adminPassword} onChange={(v: string) => setForm({ ...form, adminPassword: v })} />
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg space-y-4 shadow-xl border border-gray-700">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                        <h3 className="font-medium text-white">Pusher Settings (Optional)</h3>
                        <button
                            type="button"
                            onClick={() => setShowHelp(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                        >
                            <HelpCircle size={14} className="mr-1" />
                            How to get these?
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="App ID" value={form.pusherAppId} onChange={(v: string) => setForm({ ...form, pusherAppId: v })} />
                        <Input label="Key" value={form.pusherKey} onChange={(v: string) => setForm({ ...form, pusherKey: v })} />
                        <Input label="Secret" value={form.pusherSecret} onChange={(v: string) => setForm({ ...form, pusherSecret: v })} type="password" />
                        <Input label="Cluster" placeholder="e.g. mt1" value={form.pusherCluster} onChange={(v: string) => setForm({ ...form, pusherCluster: v })} />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading || !form.adminPassword}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl flex items-center font-semibold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Next <ArrowRight size={18} className="ml-2" />
                    </button>
                </div>
            </form>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <HelpCircle className="text-blue-400 mr-2" size={24} />
                                Pusher Setup Guide
                            </h3>
                            <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-5 text-sm text-gray-300">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">1</div>
                                <div>
                                    <p className="font-semibold text-white mb-1">Sign up/Login to Pusher</p>
                                    <p>Go to <a href="https://pusher.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center">pusher.com <ExternalLink size={12} className="ml-1" /></a> and create a free account.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">2</div>
                                <div>
                                    <p className="font-semibold text-white mb-1">Create a "Channels" App</p>
                                    <p>Select "Channels" from the dashboard and click "Create App". Give it any name and select a cluster (e.g., mt1).</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">3</div>
                                <div>
                                    <p className="font-semibold text-white mb-1">Find your App Keys</p>
                                    <p>Once created, click on the <span className="text-white font-medium">"App Keys"</span> tab in the left sidebar of your Pusher dashboard.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 border-t border-gray-800 pt-4 mt-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center font-bold">4</div>
                                <div>
                                    <p className="font-semibold text-white mb-1">Copy and Paste</p>
                                    <p>Copy the App ID, Key, Secret, and Cluster from Pusher and paste them into the fields behind this window.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            className="w-full mt-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: any) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
            />
        </div>
    )
}
