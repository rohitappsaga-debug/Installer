
import { useState, useEffect } from 'react';
import { CheckCircle2, Server, Settings, Database, PlayCircle, ShieldCheck, Key } from 'lucide-react';
import clsx from 'clsx';
import { checkLicenseStatus } from '../../api';
import LicenseStep from './LicenseStep';
import WelcomeStep from './WelcomeStep';
import RequirementsStep from './RequirementsStep';
import DatabaseStep from './DatabaseStep';
import SettingsStep from './SettingsStep';
import InstallStep from './InstallStep';
import FinishStep from './FinishStep';

const STEPS = [
    { id: 'license', title: 'License', icon: Key },
    { id: 'welcome', title: 'Welcome', icon: Server },
    { id: 'requirements', title: 'Requirements', icon: CheckCircle2 },
    { id: 'database', title: 'Database', icon: Database },
    { id: 'settings', title: 'App Settings', icon: Settings },
    { id: 'install', title: 'Installation', icon: PlayCircle },
    { id: 'finish', title: 'Finish', icon: ShieldCheck },
];

export default function InstallerWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            console.log('DEBUG: Checking license status...');
            try {
                const response = await checkLicenseStatus();
                console.log('DEBUG: License status response:', response.data);
                if (response.data.success) {
                    console.log('DEBUG: License verified, moving to Welcome step.');
                    // Update steps before closing the validator
                    setCompletedSteps([0]);
                    setCurrentStep(1);
                } else {
                    console.log('DEBUG: License not verified.');
                    setCurrentStep(0);
                    setCompletedSteps([]);
                }
            } catch (error) {
                console.error('DEBUG: Failed to check license status:', error);
                setCurrentStep(0);
            } finally {
                // Important: delay this slightly to ensure state updates have propagated
                setTimeout(() => setIsValidating(false), 100);
            }
        };

        checkStatus();
    }, []);

    const nextStep = () => {
        setCompletedSteps(prev => [...prev, currentStep]);
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const StepComponent = [
        LicenseStep,
        WelcomeStep,
        RequirementsStep,
        DatabaseStep,
        SettingsStep,
        InstallStep,
        FinishStep
    ][currentStep];

    if (isValidating) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[600px]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900/50 p-6 border-r border-gray-700 hidden md:block">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white mb-2">ROBS Installer</h1>
                    <p className="text-sm text-gray-400">Setup Wizard v1.0</p>
                </div>
                <nav className="space-y-4">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = completedSteps.includes(index);

                        return (
                            <div
                                key={step.id}
                                className={clsx(
                                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                                    isActive ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-gray-400",
                                    isCompleted && !isActive && "text-green-400"
                                )}
                            >
                                <div className={clsx(
                                    "p-1.5 rounded-full",
                                    isActive ? "bg-blue-600 text-white" : isCompleted ? "bg-green-600/20" : "bg-gray-800"
                                )}>
                                    {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                </div>
                                <span className="text-sm font-medium">{step.title}</span>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-8 overflow-y-auto">
                    <StepComponent onNext={nextStep} />
                </div>
            </div>
        </div>
    );
}
