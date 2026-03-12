import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, User as UserIcon, Activity } from 'lucide-react';
import { auditAPI } from '../../services/api';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user: {
        name: string;
        role: string;
    };
}

export function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const resp = await auditAPI.getAll();
            if (resp.success) {
                setLogs(resp.data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-600" />
                    System Activity Log
                </h2>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="bg-gray-50 border-b p-4 grid grid-cols-12 font-medium text-sm text-gray-500">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-2">User</div>
                    <div className="col-span-3">Action</div>
                    <div className="col-span-5">Details</div>
                </div>
                <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                        {logs.map(log => (
                            <div key={log.id} className="p-4 grid grid-cols-12 text-sm items-center hover:bg-gray-50 transition-colors">
                                <div className="col-span-2 flex items-center gap-2 text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <Badge variant="outline" className="font-normal">
                                        {log.user.role}
                                    </Badge>
                                    <span className="font-medium">{log.user.name}</span>
                                </div>
                                <div className="col-span-3 font-medium text-blue-700">
                                    {log.action}
                                </div>
                                <div className="col-span-5 text-gray-600 truncate" title={log.details}>
                                    {log.details || '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                    {logs.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No activity recorded yet.
                        </div>
                    )}
                </ScrollArea>
            </Card>
        </div>
    );
}
