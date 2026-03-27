import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fetchAdminAllVendors, type Vendor } from '@/lib/api';
import {
    Store,
    Loader2,
    Users,
    ShieldCheck,
    Clock,
    Search,
    MapPin,
    Building2,
    Calendar,
    ArrowUpRight,
} from 'lucide-react';

const AdminVendorsList: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0 });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminAllVendors();
            setVendors(data.vendors);
            setStats(data.stats);
        } catch (err) {
            toast({ title: 'Failed to load vendors', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter(v => {
        const matchesSearch = !search || 
            v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
            v.user_details.full_name.toLowerCase().includes(search.toLowerCase()) ||
            v.user_details.email.toLowerCase().includes(search.toLowerCase()) ||
            v.city.toLowerCase().includes(search.toLowerCase());

        if (filter === 'verified') return matchesSearch && v.is_verified;
        if (filter === 'pending') return matchesSearch && !v.is_verified;
        return matchesSearch;
    });

    const statCards = [
        { label: 'Total Vendors', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Verified', value: stats.verified, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    ];

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">All Vendors</h1>
                        <p className="text-muted-foreground">Manage and monitor all platform vendors</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statCards.map((s, i) => (
                        <Card key={i} className="cursor-pointer hover:shadow-md transition" onClick={() => {
                            if (s.label === 'Total Vendors') setFilter('all');
                            else if (s.label === 'Verified') setFilter('verified');
                            else if (s.label === 'Pending') setFilter('pending');
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
                            placeholder="Search by shop name, owner, email, or city..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'verified', 'pending'] as const).map(f => (
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

                {/* Vendors List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                            <Store className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No vendors found</h3>
                        <p className="text-sm text-slate-500 max-w-xs text-center">
                            {search 
                                ? `We couldn't find any vendors matching "${search}". Try a different term.`
                                : filter !== 'all' 
                                    ? `There are no ${filter} vendors at the moment.`
                                    : "You haven't added any vendors to the platform yet."
                            }
                        </p>
                        {(search || filter !== 'all') && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-6 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                                onClick={() => { setSearch(''); setFilter('all'); }}
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredVendors.map(v => (
                            <Card key={v.id} className="hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-orange-100 rounded-lg">
                                            <AvatarImage src={v.user_details.profile_pic} />
                                            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold rounded-lg">
                                                {v.shop_name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-bold text-lg">{v.shop_name}</h3>
                                                {v.is_verified ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                                        <Clock className="h-3 w-3 mr-1" /> Pending
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 mt-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Users size={14} className="text-slate-400" />
                                                    <span className="truncate">{v.user_details.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <span className="truncate">{v.business_type}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    <span className="truncate">{v.city}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span>Joined {new Date(v.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-none">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Balance</p>
                                                <p className="font-bold text-lg text-primary">₹{v.balance}</p>
                                            </div>
                                            <button 
                                                className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-orange-700 transition-colors"
                                                onClick={() => {/* View Details */}}
                                            >
                                                Details <ArrowUpRight size={14} />
                                            </button>
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

export default AdminVendorsList;
