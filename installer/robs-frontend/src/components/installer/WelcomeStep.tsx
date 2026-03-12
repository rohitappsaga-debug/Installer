
import { ArrowRight } from 'lucide-react';

export default function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="h-full flex flex-col justify-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Welcome to ROBS Setup</h2>
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-8">
                <p className="text-blue-100 leading-relaxed">
                    This wizard will guide you through the installation process for the Restaurant Order Booking System.
                    We will check your system requirements, configure the database, and set up the initial administrator account.
                </p>
            </div>

            <div className="space-y-4 mb-8 text-gray-300">
                <h3 className="font-semibold text-white">What needed:</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>PostgreSQL credentials (if already installed)</li>
                    <li>Admin email and password preference</li>
                    <li>Pusher credentials (optional)</li>
                </ul>
            </div>

            <button
                onClick={onNext}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-all"
            >
                <span>Start Installation</span>
                <ArrowRight size={18} />
            </button>
        </div>
    );
}
