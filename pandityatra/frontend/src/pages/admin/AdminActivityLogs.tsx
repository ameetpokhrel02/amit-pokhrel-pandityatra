import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
    id: number;
    action_type: string;
    details: string;
    ip_address: string;
    created_at: string;
    actor_name: string;
    actor_email: string;
    pandit_name: string;
}

const AdminActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [userId, setUserId] = useState('');
    const [actionType, setActionType] = useState('all');
    const [date, setDate] = useState('');
    
    const { toast } = useToast();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (userId) params.append('user', userId);
            if (actionType && actionType !== 'all') params.append('action_type', actionType);
            if (date) params.append('date', date);

            const { data } = await apiClient.get(`/admin/activity-logs/?${params.toString()}`);
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch activity logs.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleExportCSV = () => {
        if (logs.length === 0) return;
        
        const headers = ['ID', 'Date', 'Action Type', 'Actor Name', 'Actor Email', 'Pandit Name', 'Details', 'IP Address'];
        const csvRows = [
            headers.join(','),
            ...logs.map(log => [
                log.id,
                `"${format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
                `"${log.action_type}"`,
                `"${log.actor_name}"`,
                `"${log.actor_email}"`,
                `"${log.pandit_name}"`,
                `"${log.details.replace(/"/g, '""')}"`,
                `"${log.ip_address}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                        Activity Logs
                    </h1>
                    <p className="text-muted-foreground mt-2">Monitor system-wide actions and events in real-time.</p>
                </div>

                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Input
                                placeholder="Filter by User ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-[150px]"
                            />
                            
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Action Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="LOGIN">Login / Signup</SelectItem>
                                    <SelectItem value="BOOKING">Booking</SelectItem>
                                    <SelectItem value="SHOP_ORDER">Shop Order</SelectItem>
                                    <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                                    <SelectItem value="REVIEW">Review</SelectItem>
                                    <SelectItem value="SYSTEM">System</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-[150px]"
                            />
                            
                            <Button variant="secondary" onClick={fetchLogs} disabled={loading} className="gap-2">
                                <Search size={16} />
                                Filter
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={fetchLogs} disabled={loading} size="icon">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </Button>
                            <Button variant="default" onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Download size={16} />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 p-0">
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-orange-50/50">
                                    <TableRow>
                                        <TableHead className="w-[150px]">Date & Time</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-orange-500 mb-2" />
                                                <p className="text-muted-foreground">Loading logs...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No activity logs found for the selected criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-orange-50/30 transition-colors">
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{log.actor_name}</div>
                                                    <div className="text-xs text-muted-foreground">{log.actor_email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800">
                                                        {log.action_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate" title={log.details}>
                                                    {log.details}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground font-mono">
                                                    {log.ip_address || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminActivityLogs;
