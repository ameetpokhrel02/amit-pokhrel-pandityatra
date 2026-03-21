import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    Mail, 
    User, 
    Calendar,
    ChevronRight,
    MessageSquare,
    Save,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { fetchContactMessages, updateContactMessage, type ContactMessage } from '@/lib/api';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const AdminSupport: React.FC = () => {
    const { toast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await fetchContactMessages();
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast({
                title: 'Error',
                description: 'Failed to load support messages',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, isResolved: boolean) => {
        try {
            setUpdating(true);
            await updateContactMessage(id, { is_resolved: isResolved, admin_note: adminNote });
            toast({
                title: 'Success',
                description: `Message marked as ${isResolved ? 'resolved' : 'pending'}`,
            });
            loadMessages();
            if (selectedMessage) {
                setSelectedMessage({ ...selectedMessage, is_resolved: isResolved, admin_note: adminNote });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update message',
                variant: 'destructive',
            });
        } finally {
            setUpdating(false);
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = 
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
            statusFilter === 'all' || 
            (statusFilter === 'resolved' && msg.is_resolved) || 
            (statusFilter === 'pending' && !msg.is_resolved);
        
        return matchesSearch && matchesStatus;
    });

    const openMessageDetails = (msg: ContactMessage) => {
        setSelectedMessage(msg);
        setAdminNote(msg.admin_note || '');
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageCircle className="text-primary w-8 h-8" />
                            Support Enquiries
                        </h1>
                        <p className="text-gray-500 mt-1">Manage and respond to user help requests and contact submissions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1.5 h-auto text-sm bg-orange-50 text-orange-700 border-orange-200">
                            {messages.filter(m => !m.is_resolved).length} Pending Requests
                        </Badge>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-orange-100 shadow-sm overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name, email or subject..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 min-w-fit">
                                <span className="text-sm font-medium text-gray-500">Status:</span>
                                <div className="flex p-1 bg-gray-100 rounded-lg">
                                    {(['all', 'pending', 'resolved'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                                                statusFilter === s 
                                                    ? 'bg-white text-primary shadow-sm' 
                                                    : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={loadMessages}
                                className="shrink-0"
                                disabled={loading}
                            >
                                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Messages Table */}
                <Card className="border-orange-100 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-orange-50/50">
                                <TableRow>
                                    <TableHead className="w-[200px]">User</TableHead>
                                    <TableHead>Subject & Message Snippet</TableHead>
                                    <TableHead className="w-[150px]">Date</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} className="h-24">
                                                <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    <span className="text-xs">Loading enquiries...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredMessages.length > 0 ? (
                                    filteredMessages.map((msg) => (
                                        <TableRow key={msg.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openMessageDetails(msg)}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs">
                                                        {msg.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-gray-900 truncate">{msg.name}</span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-orange-400" />
                                                            {msg.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col max-w-md">
                                                    <span className="font-semibold text-gray-800 line-clamp-1">{msg.subject}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1 italic">"{msg.message}"</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700">
                                                        {format(new Date(msg.created_at), 'MMM dd, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {format(new Date(msg.created_at), 'hh:mm a')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {msg.is_resolved ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Resolved
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-primary hover:bg-orange-50">
                                                    View
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <MessageSquare className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-600">No enquiries found</p>
                                                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Message Detail Dialog */}
                <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                    <DialogContent className="max-w-2xl border-orange-100">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                Enquiry Details
                                {selectedMessage?.is_resolved && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">Resolved</Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                Received on {selectedMessage && format(new Date(selectedMessage.created_at), 'MMMM dd, yyyy at hh:mm a')}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedMessage && (
                            <div className="space-y-6 pt-4">
                                {/* User Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From Name</label>
                                        <div className="flex items-center gap-2 font-semibold">
                                            <User className="w-4 h-4 text-primary" />
                                            {selectedMessage.name}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Mail className="w-4 h-4 text-primary" />
                                            {selectedMessage.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject & Message */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                                    <div className="text-lg font-bold text-gray-900">{selectedMessage.subject}</div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Message Content</label>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                                        "{selectedMessage.message}"
                                    </div>
                                </div>

                                {/* Admin Response/Notes */}
                                <div className="space-y-3 pt-2 border-t border-orange-100">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            Admin Internal Notes / Resolution Log
                                        </label>
                                    </div>
                                    <Textarea
                                        placeholder="Write your response status or notes for other admins here..."
                                        className="min-h-[100px] border-orange-100 focus:ring-primary focus:border-primary"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button variant="ghost" onClick={() => setSelectedMessage(null)}>
                                Close
                            </Button>
                            {!selectedMessage?.is_resolved ? (
                                <Button 
                                    onClick={() => handleUpdateStatus(selectedMessage!.id, true)} 
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Mark as Resolved
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpdateStatus(selectedMessage!.id, false)} 
                                    variant="outline"
                                    disabled={updating}
                                    className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-2"
                                >
                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                                    Reopen Enquiry
                                </Button>
                            )}
                            <Button 
                                onClick={() => handleUpdateStatus(selectedMessage!.id, selectedMessage!.is_resolved)} 
                                disabled={updating || adminNote === selectedMessage?.admin_note}
                                className="bg-primary hover:bg-orange-600 text-white gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Notes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AdminSupport;
