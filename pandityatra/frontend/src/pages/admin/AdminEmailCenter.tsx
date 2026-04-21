import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Mail, Send, History, FileText, Plus, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, Layout, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api-client';

interface EmailTemplate {
    id: number;
    name: string;
    template_type: string;
    subject: string;
    html_content: string;
    created_at: string;
}

interface EmailLog {
    id: number;
    recipient_email: string;
    subject: string;
    status: string;
    sender_role: string;
    sent_at: string;
    created_at: string;
    error_message?: string;
}

const AdminEmailCenter: React.FC = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('send');

    // Form state
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
    const [isBulk, setIsBulk] = useState(false);
    const [targetRoles, setTargetRoles] = useState<string[]>(['user']);

    // Template Creation State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        template_type: 'MARKETING',
        subject: '',
        html_content: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tRes, lRes] = await Promise.all([
                api.get('/notifications/email-templates/'),
                api.get('/notifications/email-logs/')
            ]);
            setTemplates(tRes.data);
            setLogs(lRes.data);
        } catch (error) {
            console.error("Error loading email data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                recipient_email: recipient,
                subject: subject,
                content: content,
                template_id: selectedTemplate !== 'none' ? parseInt(selectedTemplate) : null,
                bulk: isBulk,
                target_roles: targetRoles
            };

            await api.post('/notifications/send-email/', payload);
            
            toast({
                title: "Success",
                description: isBulk ? "Bulk email campaign queued." : "Email queued for delivery.",
            });
            
            // Reset form
            if (!isBulk) setRecipient('');
            setSubject('');
            setContent('');
            setSelectedTemplate('none');
            
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send email. Please check your inputs.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/notifications/email-templates/', newTemplate);
            toast({
                title: "Success",
                description: "Email template created successfully.",
            });
            setIsCreateModalOpen(false);
            setNewTemplate({
                name: '',
                template_type: 'MARKETING',
                subject: '',
                html_content: ''
            });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create template.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Mail className="w-8 h-8 text-primary" />
                            Email Center
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage communication, templates, and marketing campaigns.</p>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
                        <TabsTrigger value="send" className="gap-2"><Send className="w-4 h-4" /> Send</TabsTrigger>
                        <TabsTrigger value="templates" className="gap-2"><Layout className="w-4 h-4" /> Templates</TabsTrigger>
                        <TabsTrigger value="logs" className="gap-2"><History className="w-4 h-4" /> Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="send">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 shadow-sm border-orange-100 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle>Compose Message</CardTitle>
                                    <CardDescription>Create custom or bulk email messages using professional branding.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSendEmail} className="space-y-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Button 
                                                type="button" 
                                                variant={!isBulk ? "default" : "outline"} 
                                                onClick={() => setIsBulk(false)}
                                                className="flex-1"
                                            >
                                                Direct Email
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant={isBulk ? "default" : "outline"} 
                                                onClick={() => setIsBulk(true)}
                                                className="flex-1"
                                            >
                                                Bulk Campaign
                                            </Button>
                                        </div>

                                        {!isBulk ? (
                                            <div className="space-y-2">
                                                <Label>Recipient Email</Label>
                                                <Input 
                                                    placeholder="customer@example.com" 
                                                    value={recipient}
                                                    onChange={(e) => setRecipient(e.target.value)}
                                                    required={!isBulk}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Target Roles</Label>
                                                <div className="flex gap-2">
                                                    {['user', 'pandit', 'vendor'].map(role => (
                                                        <Badge 
                                                            key={role}
                                                            variant={targetRoles.includes(role) ? "default" : "outline"}
                                                            className="cursor-pointer capitalize px-4 py-1"
                                                            onClick={() => {
                                                                if (targetRoles.includes(role)) {
                                                                    setTargetRoles(targetRoles.filter(r => r !== role));
                                                                } else {
                                                                    setTargetRoles([...targetRoles, role]);
                                                                }
                                                            }}
                                                        >
                                                            {role}s
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Template (Optional)</Label>
                                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Custom Blank Message</SelectItem>
                                                    {templates.map(t => (
                                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Subject Line</Label>
                                            <Input 
                                                placeholder="Enter email subject" 
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Message Content (HTML Supported)</Label>
                                            <Textarea 
                                                placeholder="Write your message here..." 
                                                className="min-h-[200px]"
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                disabled={selectedTemplate !== 'none'}
                                            />
                                            {selectedTemplate !== 'none' && (
                                                <p className="text-xs text-orange-500 font-medium">Template selected. Main content will be rendered from the database template.</p>
                                            )}
                                        </div>

                                        <Button type="submit" className="w-full gap-2" disabled={loading}>
                                            <Send className="w-4 h-4" />
                                            {loading ? "Queuing..." : isBulk ? "Launch Campaign" : "Send Email"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-orange-100 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle>Branding Preview</CardTitle>
                                    <CardDescription>How your email looks to users.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center">
                                        <div className="w-full text-center py-4 border-b dark:border-gray-800 mb-4">
                                            <img src="/images/AAApandityatra.png" alt="Logo" className="h-10 mx-auto" />
                                        </div>
                                        <div className="w-full space-y-3">
                                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                            <div className="h-24 w-full bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse"></div>
                                            <div className="h-10 w-1/2 bg-primary/20 rounded mx-auto"></div>
                                        </div>
                                        <div className="w-full mt-8 pt-4 border-t dark:border-gray-800 text-[10px] text-center text-gray-400">
                                            © 2026 PanditYatra. All rights reserved.
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                        <div className="flex gap-3">
                                            <ImageIcon className="w-5 h-5 text-orange-600" />
                                            <div>
                                                <p className="text-sm font-bold text-orange-900 dark:text-orange-400">Email Branding</p>
                                                <p className="text-xs text-orange-700 dark:text-orange-500/80">All emails automatically include the PanditYatra logo and professional signature.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="templates">
                        <Card className="shadow-sm border-orange-100 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Email Templates</CardTitle>
                                    <CardDescription>Manage reusable HTML components for automated and manual emails.</CardDescription>
                                </div>
                                <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                                    <Plus className="w-4 h-4" /> New Template
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templates.length > 0 ? templates.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="font-medium">{t.name}</TableCell>
                                                <TableCell><Badge variant="outline">{t.template_type}</Badge></TableCell>
                                                <TableCell className="text-gray-500 max-w-[200px] truncate">{t.subject}</TableCell>
                                                <TableCell className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-gray-400">No templates found. Create one to get started.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="logs">
                        <Card className="shadow-sm border-orange-100 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle>Transmission Logs</CardTitle>
                                <CardDescription>Audit trail of all emails sent from the platform.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Recipient</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Sender</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sent At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length > 0 ? logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium text-xs">{log.recipient_email}</TableCell>
                                                <TableCell className="text-sm truncate max-w-[200px]">{log.subject}</TableCell>
                                                <TableCell><Badge variant="secondary" className="text-[10px]">{log.sender_role}</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {log.status === 'SENT' ? <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                                         log.status === 'FAILED' ? <XCircle className="w-4 h-4 text-red-500" /> : 
                                                         <Clock className="w-4 h-4 text-orange-400" />}
                                                        <span className={`text-xs font-bold ${log.status === 'SENT' ? 'text-green-600' : log.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'}`}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[10px] text-gray-400">
                                                    {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Pending'}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-gray-400">No email logs available.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Create Template Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Create New Template</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                                        <XCircle className="w-5 h-5" />
                                    </Button>
                                </div>
                                <CardDescription>Design a reusable HTML template for your emails.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateTemplate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Template Name</Label>
                                            <Input 
                                                placeholder="e.g. Welcome Email" 
                                                value={newTemplate.name}
                                                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select 
                                                value={newTemplate.template_type} 
                                                onValueChange={(v) => setNewTemplate({...newTemplate, template_type: v})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                                    <SelectItem value="BOOKING_CONFIRMATION">Booking Confirmation</SelectItem>
                                                    <SelectItem value="PUJA_REMINDER">Puja Reminder</SelectItem>
                                                    <SelectItem value="SYSTEM_ALERT">System Alert</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Subject Line</Label>
                                        <Input 
                                            placeholder="Subject prefix or full subject" 
                                            value={newTemplate.subject}
                                            onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>HTML Content</Label>
                                        <Textarea 
                                            placeholder="<p>Hello {{name}},</p>..." 
                                            className="min-h-[250px] font-mono text-sm"
                                            value={newTemplate.html_content}
                                            onChange={(e) => setNewTemplate({...newTemplate, html_content: e.target.value})}
                                            required
                                        />
                                        <p className="text-[10px] text-gray-400 italic">Use standard HTML. The PanditYatra header and footer are automatically added.</p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? "Creating..." : "Save Template"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminEmailCenter;
