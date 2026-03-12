import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fetchAdminAllPandits, type AdminPanditData } from '@/lib/api';
import {
    Star,
    Loader2,
    Users,
    ShieldCheck,
    Clock,
    Wifi,
    Search,
    BookOpen,
    Globe,
    Calendar,
} from 'lucide-react';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={12} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        ))}
    </div>
);

const AdminPanditsList: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pandits, setPandits] = useState<AdminPanditData[]>([]);
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, online: 0 });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'online'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminAllPandits();
            setPandits(data.pandits);
            setStats(data.stats);
        } catch (err) {
            toast({ title: 'Failed to load pandits', className: 'bg-red-600 text-white border-none shadow-2xl' });
        } finally {
            setLoading(false);
        }
    };

    const filteredPandits = pandits.filter(p => {
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase()) ||
            p.expertise.toLowerCase().includes(search.toLowerCase());

        if (filter === 'verified') return matchesSearch && p.is_verified;
        if (filter === 'pending') return matchesSearch && p.verification_status === 'PENDING';
        if (filter === 'online') return matchesSearch && p.is_available;
        return matchesSearch;
    });

    const statCards = [
        { label: 'Total Pandits', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Verified', value: stats.verified, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Online Now', value: stats.online, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Pandits</h1>
                    <p className="text-muted-foreground">Complete list of all pandits in the system</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                        <Card key={i} className="cursor-pointer hover:shadow-md transition" onClick={() => {
                            if (s.label === 'Total Pandits') setFilter('all');
                            else if (s.label === 'Verified') setFilter('verified');
                            else if (s.label === 'Pending') setFilter('pending');
                            else if (s.label === 'Online Now') setFilter('online');
                        }}>
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-full ${s.bg}`}>
                                        <s.icon className={`h-5 w-5 ${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                        <p className="text-2xl font-bold">{s.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or expertise..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'verified', 'pending', 'online'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm rounded-full font-medium transition-all ${filter === f
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border hover:bg-slate-50'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pandits List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredPandits.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No pandits found</p>
                            <p className="text-sm">Try adjusting your search or filter</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredPandits.map(p => (
                            <Card key={p.id} className="hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-orange-100">
                                            <AvatarImage src={p.avatar || undefined} />
                                            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">
                                                {p.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{p.name}</span>
                                                {p.is_verified ? (
                                                    <Badge className="bg-green-100 text-green-700 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
                                                ) : p.verification_status === 'PENDING' ? (
                                                    <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Rejected</Badge>
                                                )}
                                                {p.is_available && (
                                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">🟢 Online</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                                                <span>{p.email}</span>
                                                {p.phone && <span>📞 {p.phone}</span>}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                                                    <span className="text-slate-600">{p.expertise}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Globe className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="text-slate-600">{p.language}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                                    <span className="text-slate-600">{p.experience_years} yrs exp</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <StarDisplay rating={p.rating} />
                                                    <span className="text-sm font-medium">{p.rating.toFixed(1)}</span>
                                                    <span className="text-xs text-muted-foreground">({p.review_count} reviews)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground hidden md:block">
                                            Joined {new Date(p.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminPanditsList;
