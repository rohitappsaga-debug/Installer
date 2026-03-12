
import { useState } from 'react';
import { Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { verifyLicense } from '../../api';

interface LicenseStepProps {
    onNext: () => void;
}

export default function LicenseStep({ onNext }: LicenseStepProps) {
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey.trim()) {
            setError('License key is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await verifyLicense(licenseKey);
            if (response.data.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    window.location.href = '/installer/start';
                }, 1500);
            } else {
                setError(response.data.message || 'Invalid license key');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete process. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">License Verified!</h2>
                    <p className="text-gray-400">Proceeding to the next step...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-6">
                    <Key className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">License Verification</h2>
                <p className="text-gray-400">
                    To continue with the installation, please enter your valid product license key.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="license-key" className="block text-sm font-medium text-gray-300 mb-2">
                        License Key
                    </label>
                    <div className="relative">
                        <input
                            id="license-key"
                            type="text"
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400 leading-relaxed">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                        </>
                    ) : (
                        <span>Verify & Continue</span>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center text-xs text-gray-500">
                Contact support if you're having trouble with your license key.
            </div>
        </div>
    );
}
