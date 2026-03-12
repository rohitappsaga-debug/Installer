
import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Terminal } from 'lucide-react';

export default function InstallStep({ onNext }: { onNext: () => void }) {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<any>({}); // { dependencies: 'pending', ... }
    const [completed, setCompleted] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start SSE
        const eventSource = new EventSource('/api/install/install/run');

        eventSource.onopen = () => {
            setLogs(prev => [...prev, 'Starting installation process...']);
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'log') {
                setLogs(prev => [...prev, data.message]);
            } else if (data.type === 'status') {
                setStatus((prev: any) => ({ ...prev, [data.step]: data.status }));
            } else if (data.type === 'complete') {
                setCompleted(true);
                eventSource.close();
            } else if (data.type === 'error') {
                setLogs(prev => [...prev, `ERROR: ${data.message}`]);
                eventSource.close();
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6">Installation Progress</h2>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatusCard label="Dependencies" status={status.dependencies} />
                <StatusCard label="Database" status={status.database} />
                <StatusCard label="Seeding" status={status.seeding} />
                <StatusCard label="Build" status={status.build} />
            </div>

            <div className="flex-1 bg-black rounded-lg border border-gray-800 p-4 font-mono text-sm overflow-hidden flex flex-col shadow-inner">
                <div className="flex items-center text-gray-500 mb-2 pb-2 border-b border-gray-800">
                    <Terminal size={14} className="mr-2" />
                    <span>Installation Log</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 text-gray-300">
                    {logs.map((log, i) => (
                        <div key={i} className="break-all border-l-2 border-transparent hover:border-blue-900 pl-2">
                            <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!completed}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-700 text-white rounded-lg font-medium transition-all"
                >
                    Finish Installation
                </button>
            </div>
        </div>
    );
}

function StatusCard({ label, status }: any) {
    const isRunning = status === 'running';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    return (
        <div className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${isRunning ? 'bg-blue-900/20 border-blue-800 animate-pulse' :
            isSuccess ? 'bg-green-900/20 border-green-800' :
                isError ? 'bg-red-900/20 border-red-800' :
                    'bg-gray-800 border-gray-700 opacity-50'
            }`}>
            <span className={`text-sm font-medium mb-1 ${isSuccess ? 'text-green-400' : 'text-gray-300'
                }`}>{label}</span>
            {isSuccess && <CheckCircle size={16} className="text-green-500" />}
        </div>
    )
}
