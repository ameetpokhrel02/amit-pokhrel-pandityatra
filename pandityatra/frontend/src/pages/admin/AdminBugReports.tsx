import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
    AlertTriangle, Bug, CheckCircle2, Clock, Loader2, 
    ExternalLink, Eye, X, ShieldAlert, ArrowUpDown 
} from "lucide-react";
import apiClient from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface BugReportItem {
    id: number;
    title: string;
    description: string;
    category: string;
    severity: string;
    attachment_url: string | null;
    status: string;
    reported_by_detail: {
        id: number;
        full_name: string;
        email: string;
        role: string;
        profile_pic: string | null;
    };
    admin_comment: string | null;
    created_at: string;
    updated_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-purple-100 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    NEW: <AlertTriangle className="h-3.5 w-3.5" />,
    IN_PROGRESS: <Clock className="h-3.5 w-3.5" />,
    RESOLVED: <CheckCircle2 className="h-3.5 w-3.5" />,
};

const AdminBugReports = () => {
    const { toast } = useToast();
    const [bugs, setBugs] = useState<BugReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedBug, setSelectedBug] = useState<BugReportItem | null>(null);
    const [adminComment, setAdminComment] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchBugs();
    }, [filterStatus]);

    const fetchBugs = async () => {
        setLoading(true);
        try {
            const params = filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
            const res = await apiClient.get(`/bug-reports/admin/reports/${params}`);
            setBugs(res.data);
        } catch (error) {
            console.error("Error fetching bug reports:", error);
            toast({ title: "Error", description: "Failed to load bug reports.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedBug || !newStatus) return;
        setUpdating(true);
        try {
            await apiClient.patch(`/bug-reports/reports/${selectedBug.id}/update_status/`, {
                status: newStatus,
                admin_comment: adminComment || undefined,
            });
            toast({ title: "Updated", description: `Bug #${selectedBug.id} status updated to ${newStatus}.` });
            setSelectedBug(null);
            setAdminComment('');
            setNewStatus('');
            fetchBugs();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const statusCounts = {
        ALL: bugs.length,
        NEW: bugs.filter(b => b.status === 'NEW').length,
        IN_PROGRESS: bugs.filter(b => b.status === 'IN_PROGRESS').length,
        RESOLVED: bugs.filter(b => b.status === 'RESOLVED').length,
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                        <Bug className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Bug Reports</h1>
                        <p className="text-muted-foreground">Manage user-submitted bug reports and feedback.</p>
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {(['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map(status => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'default' : 'outline'}
                            className={`rounded-xl px-5 h-10 font-medium transition-all ${
                                filterStatus === status
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20'
                                    : 'hover:bg-orange-50 hover:text-orange-700'
                            }`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'ALL' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase()}
                            <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                                {statusCounts[status] || 0}
                            </Badge>
                        </Button>
                    ))}
                </div>

                {/* Bug Reports Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    </div>
                ) : bugs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-300" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Bug Reports</h3>
                            <p className="text-muted-foreground">No bugs match this filter. All clear!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-none shadow-xl rounded-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableHead className="font-bold">ID</TableHead>
                                    <TableHead className="font-bold">Title</TableHead>
                                    <TableHead className="font-bold">Reporter</TableHead>
                                    <TableHead className="font-bold">Category</TableHead>
                                    <TableHead className="font-bold">Severity</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Date</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bugs.map((bug) => (
                                    <TableRow key={bug.id} className="hover:bg-orange-50/50 transition-colors">
                                        <TableCell className="font-mono font-bold text-sm">#{bug.id}</TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate">{bug.title}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-medium">{bug.reported_by_detail?.full_name || 'Unknown'}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{bug.reported_by_detail?.role}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{bug.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${SEVERITY_COLORS[bug.severity]} border text-xs gap-1`} variant="outline">
                                                {bug.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${STATUS_COLORS[bug.status]} border text-xs gap-1`} variant="outline">
                                                {STATUS_ICONS[bug.status]}
                                                {bug.status === 'IN_PROGRESS' ? 'In Progress' : bug.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(bug.created_at).toLocaleDateString('en-IN', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-orange-600 hover:bg-orange-50"
                                                onClick={() => {
                                                    setSelectedBug(bug);
                                                    setNewStatus(bug.status);
                                                    setAdminComment(bug.admin_comment || '');
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Detail Panel / Modal */}
                <AnimatePresence>
                    {selectedBug && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedBug(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between rounded-t-3xl z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-xl">
                                            <Bug className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold">Bug #{selectedBug.id}</h2>
                                            <p className="text-xs text-muted-foreground">{new Date(selectedBug.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedBug(null)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{selectedBug.title}</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge className={`${SEVERITY_COLORS[selectedBug.severity]} border`} variant="outline">
                                                {selectedBug.severity}
                                            </Badge>
                                            <Badge variant="outline">{selectedBug.category}</Badge>
                                            <Badge className={`${STATUS_COLORS[selectedBug.status]} border gap-1`} variant="outline">
                                                {STATUS_ICONS[selectedBug.status]}
                                                {selectedBug.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                                        <p className="text-sm font-semibold text-muted-foreground mb-2">Reporter</p>
                                        <p className="font-medium">{selectedBug.reported_by_detail?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedBug.reported_by_detail?.email} • <span className="capitalize">{selectedBug.reported_by_detail?.role}</span></p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground mb-2">Description</p>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedBug.description}</p>
                                    </div>

                                    {selectedBug.attachment_url && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-2">Attachment</p>
                                            {selectedBug.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={selectedBug.attachment_url} alt="Attachment" className="rounded-2xl max-h-64 object-contain border shadow-sm" />
                                            ) : (
                                                <a href={selectedBug.attachment_url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-orange-600 hover:underline font-medium"
                                                >
                                                    <ExternalLink className="h-4 w-4" /> View Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <hr />

                                    <div className="space-y-4">
                                        <p className="text-sm font-semibold">Update Status</p>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Admin Comment</label>
                                            <Textarea
                                                placeholder="Add a comment about this bug..."
                                                value={adminComment}
                                                onChange={(e) => setAdminComment(e.target.value)}
                                                className="rounded-xl min-h-[100px]"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleUpdateStatus}
                                            disabled={updating}
                                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold"
                                        >
                                            {updating ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default AdminBugReports;
