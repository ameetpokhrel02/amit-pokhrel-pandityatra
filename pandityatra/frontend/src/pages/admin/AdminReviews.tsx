import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    fetchAdminReviews,
    toggleReviewStatus,
    deleteReview,
    type AdminPanditReview,
    type AdminSiteReview,
} from '@/lib/api';
import {
    Star,
    CheckCircle2,
    XCircle,
    Trash2,
    Loader2,
    MessageSquare,
    ShieldCheck,
    Eye,
    EyeOff,
    Users,
    Globe,
} from 'lucide-react';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={14} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        ))}
    </div>
);

const AdminReviews: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [panditReviews, setPanditReviews] = useState<AdminPanditReview[]>([]);
    const [siteReviews, setSiteReviews] = useState<AdminSiteReview[]>([]);
    const [stats, setStats] = useState({ pandit_avg: 0, pandit_total: 0, site_avg: 0, site_total: 0 });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminReviews();
            setPanditReviews(data.pandit_reviews);
            setSiteReviews(data.site_reviews);
            setStats(data.stats);
        } catch (err) {
            toast({ title: 'Failed to load reviews', className: 'bg-red-600 text-white border-none shadow-2xl' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleToggle = async (type: 'pandit' | 'site', id: number) => {
        setActionLoading(`toggle-${type}-${id}`);
        try {
            await toggleReviewStatus(type, id);
            toast({ title: '✅ Status updated', className: 'bg-green-600 text-white border-none shadow-2xl' });
            loadData();
        } catch {
            toast({ title: 'Failed to update', className: 'bg-red-600 text-white border-none shadow-2xl' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (type: 'pandit' | 'site', id: number) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        setActionLoading(`delete-${type}-${id}`);
        try {
            await deleteReview(type, id);
            toast({ title: '🗑️ Review deleted', className: 'bg-orange-600 text-white border-none shadow-2xl' });
            loadData();
        } catch {
            toast({ title: 'Failed to delete', className: 'bg-red-600 text-white border-none shadow-2xl' });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reviews Management</h1>
                    <p className="text-muted-foreground">Manage all pandit reviews & app reviews</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-blue-100">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pandit Reviews</p>
                                    <p className="text-2xl font-bold">{stats.pandit_total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-yellow-100">
                                    <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pandit Avg Rating</p>
                                    <p className="text-2xl font-bold">{stats.pandit_avg} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-green-100">
                                    <Globe className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">App Reviews</p>
                                    <p className="text-2xl font-bold">{stats.site_total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-orange-100">
                                    <Star className="h-5 w-5 text-orange-600 fill-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">App Avg Rating</p>
                                    <p className="text-2xl font-bold">{stats.site_avg} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="pandit" className="w-full">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                            <TabsTrigger value="pandit" className="gap-2">
                                <Users className="h-4 w-4" />
                                Pandit Reviews ({stats.pandit_total})
                            </TabsTrigger>
                            <TabsTrigger value="site" className="gap-2">
                                <Globe className="h-4 w-4" />
                                App Reviews ({stats.site_total})
                            </TabsTrigger>
                        </TabsList>

                        {/* Pandit Reviews Tab */}
                        <TabsContent value="pandit" className="mt-4 space-y-3">
                            {panditReviews.length === 0 ? (
                                <Card><CardContent className="py-12 text-center text-muted-foreground">No pandit reviews yet</CardContent></Card>
                            ) : (
                                panditReviews.map(r => (
                                    <Card key={`p-${r.id}`} className={`transition-all ${!r.is_verified ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={r.customer_avatar || undefined} />
                                                    <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                                                        {r.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">{r.customer_name}</span>
                                                        <span className="text-xs text-muted-foreground">→</span>
                                                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                                            Pandit: {r.pandit_name}
                                                        </Badge>
                                                        {r.is_verified ? (
                                                            <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-xs">Unverified</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <StarDisplay rating={r.rating} />
                                                        <span className="text-xs text-muted-foreground">
                                                            Booking #{r.booking_id} · {new Date(r.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{r.comment}</p>
                                                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                        <span>Professionalism: {r.professionalism}★</span>
                                                        <span>Knowledge: {r.knowledge}★</span>
                                                        <span>Punctuality: {r.punctuality}★</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={r.is_verified ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}
                                                        onClick={() => handleToggle('pandit', r.id)}
                                                        disabled={actionLoading === `toggle-pandit-${r.id}`}
                                                    >
                                                        {actionLoading === `toggle-pandit-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                            r.is_verified ? <EyeOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete('pandit', r.id)}
                                                        disabled={actionLoading === `delete-pandit-${r.id}`}
                                                    >
                                                        {actionLoading === `delete-pandit-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Site Reviews Tab */}
                        <TabsContent value="site" className="mt-4 space-y-3">
                            {siteReviews.length === 0 ? (
                                <Card><CardContent className="py-12 text-center text-muted-foreground">No app reviews yet</CardContent></Card>
                            ) : (
                                siteReviews.map(r => (
                                    <Card key={`s-${r.id}`} className={`transition-all ${!r.is_approved ? 'border-red-200 bg-red-50/30' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={r.user_avatar || undefined} />
                                                    <AvatarFallback className="bg-orange-50 text-orange-600 text-xs font-bold">
                                                        {r.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">{r.user_name}</span>
                                                        <Badge variant="secondary" className={`text-xs ${r.role === 'pandit' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {r.role === 'pandit' ? '🙏 Pandit' : '👤 Customer'}
                                                        </Badge>
                                                        {r.is_approved ? (
                                                            <Badge className="bg-green-100 text-green-700 text-xs"><Eye className="h-3 w-3 mr-1" />Visible</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-red-600 border-red-300 text-xs"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <StarDisplay rating={r.rating} />
                                                        <span className="text-xs text-muted-foreground">
                                                            {r.user_email} · {new Date(r.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-2">{r.comment}</p>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={r.is_approved ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}
                                                        onClick={() => handleToggle('site', r.id)}
                                                        disabled={actionLoading === `toggle-site-${r.id}`}
                                                    >
                                                        {actionLoading === `toggle-site-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                            r.is_approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete('site', r.id)}
                                                        disabled={actionLoading === `delete-site-${r.id}`}
                                                    >
                                                        {actionLoading === `delete-site-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminReviews;
