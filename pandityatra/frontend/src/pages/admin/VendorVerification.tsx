import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, 
    CheckCircle, 
    XCircle, 
    FileText, 
    Phone, 
    Mail, 
    Store, 
    MapPin, 
    Building2,
    ExternalLink,
    AlertCircle,
    Clock,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { fetchPendingVendors, verifyVendor, rejectVendor, type Vendor } from '@/lib/api';

const VendorVerification: React.FC = () => {
    const { toast } = useToast();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadPendingVendors();
    }, []);

    const loadPendingVendors = async () => {
        setLoading(true);
        try {
            const data = await fetchPendingVendors();
            setVendors(data);
        } catch (err) {
            toast({ title: 'Failed to load pending vendors', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (vendorId: number) => {
        setActionLoading(vendorId);
        try {
            await verifyVendor(vendorId);
            toast({ title: 'Vendor Approved', description: 'The vendor can now start selling on the platform.' });
            loadPendingVendors();
        } catch (err) {
            toast({ title: 'Approval failed', variant: 'destructive' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (vendorId: number) => {
        if (!rejectReason.trim()) {
            toast({ title: 'Reason required', description: 'Please provide a reason for rejection.', variant: 'destructive' });
            return;
        }

        setActionLoading(vendorId);
        try {
            await rejectVendor(vendorId, rejectReason);
            toast({ title: 'Vendor Rejected', description: 'Notification has been sent (simulated).' });
            loadPendingVendors();
            setSelectedVendor(null);
            setRejectReason('');
        } catch (err) {
            toast({ title: 'Rejection failed', variant: 'destructive' });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Verification</h1>
                    <p className="text-muted-foreground">Review and approve new vendor applications</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : vendors.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-200" />
                            <p className="font-medium text-slate-600">All caught up!</p>
                            <p className="text-sm text-muted-foreground">No pending vendor applications at the moment.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence>
                            {vendors.map((vendor) => (
                                <motion.div
                                    key={vendor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                >
                                    <Card className="overflow-hidden border-orange-100 hover:border-orange-200 transition-colors">
                                        <CardHeader className="bg-orange-50/50 border-b border-orange-100/50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
                                                        <Store size={24} />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">{vendor.shop_name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1.5 mt-0.5">
                                                            <Building2 size={13} /> {vendor.business_type}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-bold">
                                                    PENDING REVIEW
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Details Column */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contact Person</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                                        {vendor.user_details.full_name[0]}
                                                                    </div>
                                                                    {vendor.user_details.full_name}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-slate-600 pl-1">
                                                                    <Phone size={14} className="text-slate-400" /> {vendor.user_details.phone_number}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-slate-600 pl-1">
                                                                    <Mail size={14} className="text-slate-400" /> {vendor.user_details.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Location</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                                                    <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                                                    <span>{vendor.address}, {vendor.city}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                                    <Clock size={14} className="text-slate-400" />
                                                                    Applied {new Date(vendor.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                                            <ShieldCheck size={16} className="text-emerald-600" /> ID Verification Document
                                                        </h4>
                                                        {vendor.id_proof ? (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                    <FileText size={18} className="text-blue-500" />
                                                                    <span>Vendor_Identity_Proof_{vendor.id}.pdf</span>
                                                                </div>
                                                                <Button variant="outline" size="sm" className="bg-white" asChild>
                                                                    <a href={vendor.id_proof} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink size={14} className="mr-2" /> View Document
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Alert variant="destructive" className="bg-red-50 py-2 border-red-100">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <AlertDescription className="text-xs">No ID proof uploaded. Consider rejecting or contacting the vendor.</AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions Column */}
                                                <div className="flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                                    <Button
                                                        onClick={() => handleApprove(vendor.id)}
                                                        disabled={!!actionLoading}
                                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm"
                                                    >
                                                        {actionLoading === vendor.id ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} className="mr-2" /> Approve Vendor</>}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setSelectedVendor(vendor)}
                                                        disabled={!!actionLoading}
                                                        className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                                    >
                                                        <XCircle size={18} className="mr-2" /> Reject Application
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <AnimatePresence>
                {selectedVendor && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-orange-100"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <XCircle size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Reject Application</h3>
                                    <p className="text-sm text-slate-500">{selectedVendor.shop_name}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="text-sm font-bold text-slate-700">Reason for Rejection</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why this application is being rejected (e.g. invalid document, blurry photo)..."
                                    className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none bg-slate-50"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => { setSelectedVendor(null); setRejectReason(''); }}
                                    variant="ghost"
                                    className="flex-1 h-12 font-bold text-slate-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleReject(selectedVendor.id)}
                                    disabled={!rejectReason.trim() || !!actionLoading}
                                    className="flex-3 h-12 bg-red-600 hover:bg-red-700 font-bold px-8"
                                >
                                    {actionLoading === selectedVendor.id ? <Loader2 size={18} className="animate-spin text-white" /> : 'Reject Application'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default VendorVerification;
