import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { Users, User, BookOpen, DollarSign, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Bell, XCircle, Calendar, Package, FileWarning, Activity, ArrowUpRight, ArrowDownRight, Search, Filter, RefreshCw, Clock, MoreVertical, CreditCard, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchAdminStats, fetchBookings, fetchSamagriItems, fetchAdminPayments } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AdminStats, Booking, SamagriItem, AdminPayment } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sampleChartData = [
    { month: 'Jan', bookings: 120, revenue: 15000 },
    { month: 'Feb', bookings: 98, revenue: 12000 },
    { month: 'Mar', bookings: 140, revenue: 18000 },
    { month: 'Apr', bookings: 110, revenue: 13500 },
    { month: 'May', bookings: 160, revenue: 20000 },
    { month: 'Jun', bookings: 130, revenue: 17000 },
];

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [samagri, setSamagri] = useState<SamagriItem[]>([]);
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [paymentPage, setPaymentPage] = useState(1);
    const paymentsPerPage = 5;
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const loadData = async () => {
        try {
            const [s, b, i, p] = await Promise.all([
                fetchAdminStats(),
                fetchBookings(),
                fetchSamagriItems(),
                fetchAdminPayments()
            ]);
            setStats(s);
            setRecentBookings(b.slice(0, 5));
            setSamagri(i);
            setPayments(p);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Revenue Goal calculation (Target: ₹2,00,000)
    const revenueGoal = 200000;
    const currentRevenue = stats?.revenue_this_month || 0;
    const revenueGoalPercent = Math.min(Math.round((currentRevenue / revenueGoal) * 100), 100);

    if (loading && !stats) {
        return <div className="flex items-center justify-center h-screen bg-[#FDFCFB]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
        </div>;
    }

    return (
        <DashboardLayout userRole="admin">
            <div className="min-h-screen bg-[#FDFCFB] p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || 'Admin'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-400 font-medium">Last updated</p>
                            <p className="text-sm font-bold text-gray-700">{lastUpdated.toLocaleTimeString()}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-orange-100 flex items-center justify-center relative">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                    </div>
                </div>

                {/* Metric Cards Row 1 - Modern Look */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <MetricCard 
                        title="Total Users" 
                        value={stats?.total_users || 0} 
                        change={stats?.user_growth || 0} 
                        icon={<Users className="w-6 h-6" />}
                        onClick={() => navigate('/admin/users')}
                    />
                    <MetricCard 
                        title="Total Pandits" 
                        value={stats?.total_pandits || 0} 
                        change={stats?.pandit_growth || 0} 
                        icon={<User className="w-6 h-6" />}
                        onClick={() => navigate('/admin/pandits-list')}
                        subtitle={`${stats?.pending_verifications || 0} pending verification`}
                    />
                    <MetricCard 
                        title="Total Vendors" 
                        value={stats?.total_vendors || 0} 
                        change={0} 
                        icon={<Store className="w-6 h-6" />}
                        onClick={() => navigate('/admin/vendors-list')}
                        subtitle={`${stats?.pending_vendors || 0} pending verification`}
                    />
                    <MetricCard 
                        title="Total Bookings" 
                        value={stats?.total_bookings || 0} 
                        change={stats?.booking_growth || 0} 
                        icon={<BookOpen className="w-6 h-6" />}
                        onClick={() => navigate('/admin/bookings')}
                    />
                    <MetricCard 
                        title="Revenue This Month" 
                        value={`₹${(stats?.revenue_this_month || 0).toLocaleString()}`} 
                        change={stats?.revenue_growth || 0} 
                        icon={<DollarSign className="w-6 h-6" />}
                        onClick={() => navigate('/admin/payments')}
                    />
                </div>

                {/* Second Row: Insightful Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <InsightCard 
                        title="Pending Pandits" 
                        value={stats?.pending_verifications || 0} 
                        icon={<CheckCircle className="w-5 h-5" />} 
                        color="red" 
                        onClick={() => navigate('/admin/pandits-list')}
                    />
                    <InsightCard 
                        title="Pending Vendors" 
                        value={stats?.pending_vendors || 0} 
                        icon={<Store className="w-5 h-5" />} 
                        color="orange" 
                        onClick={() => navigate('/admin/vendors-verification')}
                    />
                    <InsightCard 
                        title="Low Stock" 
                        value={stats?.low_stock_count || 0} 
                        icon={<Package className="w-5 h-5" />} 
                        color="orange" 
                        onClick={() => navigate('/admin/inventory')}
                    />
                    <InsightCard 
                        title="Today's Bookings" 
                        value={stats?.todays_pujas_count || 0} 
                        icon={<Calendar className="w-5 h-5" />} 
                        color="green" 
                        onClick={() => navigate('/admin/bookings')}
                    />
                    <InsightCard 
                        title="Errors" 
                        value={stats?.error_logs_count || 0} 
                        icon={<AlertTriangle className="w-5 h-5" />} 
                        color="red" 
                        onClick={() => navigate('/admin/activity-logs')}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="lg:col-span-2 rounded-2xl shadow-sm border border-orange-100 bg-white p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Bookings & Revenue Trend</h3>
                                <p className="text-sm text-gray-500">Monthly analysis</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sampleChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                                        dy={10}
                                    />
                                    <YAxis yAxisId="left" hide />
                                    <YAxis yAxisId="right" orientation="right" hide />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={3} dot={{ r: 4, fill: '#FF6B35', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border border-orange-100 bg-white p-6 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Revenue Goal</h3>
                        <p className="text-sm text-gray-500 mb-6">Monthly Target: ₹{(revenueGoal/1000).toFixed(0)}k</p>
                        <div className="relative flex items-center justify-center">
                            <svg className="w-48 h-48 transform -rotate-90">
                                <circle cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                                <circle
                                    cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                                    strokeDasharray={440} strokeDashoffset={440 - (440 * revenueGoalPercent) / 100}
                                    strokeLinecap="round" className="text-[#FF6B35] transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-gray-900">{revenueGoalPercent}%</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                                <p className="text-[10px] uppercase font-bold text-orange-400 mb-1">Current</p>
                                <p className="text-sm font-bold text-orange-700">₹{((stats?.revenue_this_month || 0)/1000).toFixed(1)}k</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Remaining</p>
                                <p className="text-sm font-bold text-gray-700">₹{Math.max(0, (revenueGoal - (stats?.revenue_this_month || 0))/1000).toFixed(1)}k</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <Card className="lg:col-span-2 rounded-2xl shadow-sm border border-orange-100 bg-white overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                            <button onClick={() => navigate('/admin/bookings')} className="text-xs font-bold text-[#FF6B35] hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400">Customer</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400">Pandit</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400">Puja</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400 text-right">Amount</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400 text-center">Status</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentBookings.map((b) => (
                                        <TableRow key={b.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="font-semibold text-gray-900">{b.user_full_name || 'Customer'}</div>
                                                <div className="text-[10px] text-gray-400">{b.booking_date}</div>
                                            </TableCell>
                                            <TableCell className="py-4 text-sm text-gray-600">{b.pandit_full_name || 'Pandit'}</TableCell>
                                            <TableCell className="py-4 text-sm text-gray-600">{b.service_name}</TableCell>
                                            <TableCell className="py-4 text-right font-bold text-gray-900">₹{b.total_fee}</TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                                    b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                                    b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {b.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <button className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border border-orange-100 bg-white p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Inventory Alert</h3>
                            <span className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-md">Low Stock</span>
                        </div>
                        <div className="space-y-4">
                            {samagri.filter(i => i.stock_quantity <= 5).slice(0, 4).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all cursor-pointer">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                        <img src={item.image || '/logo192.png'} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-red-500 font-medium">{item.stock_quantity} left</p>
                                    </div>
                                    <button onClick={() => navigate('/admin/inventory')} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-[#FF6B35]">
                                        <Package className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/admin/inventory')} className="w-full mt-6 py-3 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors">
                            Full Inventory Report
                        </button>
                    </Card>
                </div>

                {/* Payments Table with Pagination */}
                <Card className="rounded-2xl shadow-sm border border-orange-100 bg-white overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Payment Transactions</h3>
                            <p className="text-sm text-gray-400">Manage and track all customer payments</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500"><Filter className="w-4 h-4" /></button>
                            <button className="p-2 rounded-lg bg-[#FF6B35] text-white"><Search className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-400">Customer</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-400">Amount</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-400">Status</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-400">Paid by</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.slice((paymentPage - 1) * paymentsPerPage, paymentPage * paymentsPerPage).map((p) => (
                                    <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-orange-100">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_details?.full_name}`} />
                                                    <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">{p.user_details?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{p.user_details?.full_name || 'Customer'}</div>
                                                    <div className="text-xs text-gray-400">{p.user_details?.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 font-bold text-gray-900">₹{p.amount.toLocaleString()}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                                p.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                                                p.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {p.status === 'COMPLETED' ? 'Paid' : p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 w-fit">
                                                {p.payment_method === 'STRIPE' ? (
                                                    <div className="flex items-center gap-1">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-2.5 w-auto" alt="Visa" />
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4 w-auto" alt="Mastercard" />
                                                    </div>
                                                ) : p.payment_method === 'KHALTI' ? (
                                                    <div className="flex items-center gap-1">
                                                        <img src="/images/khalti.webp" className="h-4 w-auto object-contain" alt="Khalti" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                        {!p.user_details && <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[8px] text-white font-bold">K</div>}
                                                    </div>
                                                ) : p.payment_method === 'ESEWA' ? (
                                                    <div className="flex items-center gap-1">
                                                        <img src="https://esewa.com.np/common/images/esewa_logo.png" className="h-4 w-auto" alt="eSewa" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    </div>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center text-[8px] text-white font-bold">P</div>
                                                )}
                                                <span className="text-[10px] font-bold text-gray-600 uppercase">{p.payment_method}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-6 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-400">Showing <span className="text-gray-900 font-bold">{(paymentPage - 1) * paymentsPerPage + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(paymentPage * paymentsPerPage, payments.length)}</span> of <span className="text-gray-900 font-bold">{payments.length}</span> entries</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPaymentPage(p => Math.max(1, p - 1))} disabled={paymentPage === 1} className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPaymentPage(p => Math.min(Math.ceil(payments.length / paymentsPerPage), p + 1))} disabled={paymentPage === Math.ceil(payments.length / paymentsPerPage)} className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

const MetricCard: React.FC<{ title: string; value: string | number; change: number; icon: React.ReactNode; onClick: () => void; subtitle?: string; }> = ({ title, value, change, icon, onClick, subtitle }) => (
    <Card className="p-6 rounded-2xl shadow-sm border border-orange-100 bg-white hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-orange-50 text-[#FF6B35] group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">{icon}</div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}%
            </div>
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h4>
            {subtitle && <p className="text-[10px] text-orange-500 font-bold mt-1 uppercase tracking-tight">{subtitle}</p>}
        </div>
    </Card>
);

const InsightCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: 'red' | 'orange' | 'green'; onClick: () => void; }> = ({ title, value, icon, color, onClick }) => {
    const colors = { red: 'border-red-500 text-red-600 bg-red-50', orange: 'border-orange-400 text-orange-600 bg-orange-50', green: 'border-green-500 text-green-600 bg-green-50' };
    return (
        <Card className={`p-4 rounded-xl shadow-sm border border-orange-100 border-l-4 ${colors[color]} hover:scale-[1.02] transition-transform cursor-pointer bg-white`} onClick={onClick}>
            <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p><p className="text-xl font-black">{value}</p></div>
                <div className="p-2 rounded-lg bg-white/50">{icon}</div>
            </div>
        </Card>
    );
};

export default AdminDashboard;
