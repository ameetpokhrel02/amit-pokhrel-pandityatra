import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Package, 
    ShoppingCart, 
    TrendingUp, 
    Wallet, 
    AlertCircle, 
    Plus,
    Clock,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Smartphone,
    ShoppingBag,
    History,
    FileText
} from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { fetchVendorStats, fetchVendorOrders, type ShopOrder } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { VerificationWall } from '@/components/dashboard/VerificationWall';

const VendorDashboard = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<ShopOrder[]>([]);
    const [errorStatus, setErrorStatus] = useState<'PENDING' | 'REJECTED' | 'INCOMPLETE' | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const statsData = await fetchVendorStats();
            setStats(statsData);
            if (!statsData.is_verified && statsData.verification_status !== 'APPROVED') {
                setErrorStatus(statsData.verification_status as any);
            }
        } catch (error: any) {
            console.error("Error fetching dashboard data", error);
            if (error.response?.status === 404) {
                setErrorStatus('INCOMPLETE');
            } else {
                toast({ title: "Error", description: "Could not load dashboard stats", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }

        // Load recent orders separately — errors here should not block the dashboard
        try {
            const ordersData = await fetchVendorOrders();
            setRecentOrders(ordersData.slice(0, 5));
        } catch (err) {
            console.warn("Could not load recent orders for dashboard", err);
        }
    };

    if (loading) {
        return (
            <DashboardLayout userRole="vendor">
                <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                    <p className="text-muted-foreground animate-pulse">Synchronizing your shop data...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (errorStatus) {
        return (
            <DashboardLayout userRole="vendor">
                <VerificationWall role="vendor" status={errorStatus} />
            </DashboardLayout>
        );
    }

    const statCards = [
        { title: 'Total Revenue', value: `Rs. ${stats?.total_revenue || 0}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', link: '/vendor/payouts' },
        { title: 'New Orders', value: stats?.total_orders || 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', link: '/vendor/orders' },
        { title: 'Current Balance', value: `Rs. ${stats?.current_balance || 0}`, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50', link: '/vendor/payouts' },
        { title: 'My Products', value: stats?.total_products || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', link: '/vendor/products' },
    ];

    return (
        <DashboardLayout userRole="vendor">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">Shop Dashboard</h1>
                        <p className="text-muted-foreground mt-1 font-medium">Welcome back! Here's how your business is doing today.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-700 dark:text-orange-400 font-semibold" onClick={() => navigate('/vendor/products')}>
                            Manage Shop
                        </Button>
                        <Button asChild variant="outline" className="border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-semibold shadow-sm">
                            <Link to="/shop/samagri">
                                <ShoppingBag className="mr-2 h-4 w-4" /> Preview Shop
                            </Link>
                        </Button>
                        <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 dark:shadow-none" onClick={() => navigate('/vendor/products')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, i) => (
                        <Link key={i} to={stat.link}>
                            <Card className="hover:shadow-md transition-all border-none shadow-sm h-full group bg-white dark:bg-gray-900">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                                    <div className={`p-2 rounded-xl ${stat.bg} dark:bg-opacity-10 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-7">
                    {/* Recent Orders */}
                    <Card className="md:col-span-4 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 pr-4">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" /> Recent Sales
                                </CardTitle>
                                <CardDescription>Your latest customer transactions</CardDescription>
                            </div>
                            <Button variant="link" className="text-orange-600 font-bold" asChild>
                                <Link to="/vendor/orders">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.length === 0 ? (
                                    <div className="text-center py-10 space-y-3">
                                        <History className="mx-auto h-12 w-12 text-gray-200" />
                                        <p className="text-muted-foreground font-medium">No orders to display</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate('/vendor/orders')}>
                                            <div className="flex gap-4 items-center">
                                                <div className="h-10 w-10 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 font-bold text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100">
                                                    {order.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{order.full_name}</p>
                                                    <p className="text-xs text-gray-400 font-medium">Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 leading-none">Rs. {order.total_amount}</p>
                                                <Badge variant="secondary" className={`mt-2 text-[10px] uppercase font-bold ${order.status === 'PAID' ? 'bg-blue-50 text-blue-700' : order.status === 'SHIPPED' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Health / Alerts */}
                    <Card className="md:col-span-3 border-none shadow-sm bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-orange-600" /> Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                            {stats && stats.low_stock_count > 0 && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-right duration-500">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                            <Package className="h-3.5 w-3.5 text-red-600" />
                                        </div>
                                        <p className="text-sm font-bold text-red-700">{stats.low_stock_count} Product{stats.low_stock_count > 1 ? 's' : ''} Low on Stock</p>
                                    </div>
                                    {(stats.low_stock_items || []).map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-red-100 shrink-0 shadow-sm">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-red-300 font-bold text-xs">
                                                        {item.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-red-800 truncate">{item.name}</p>
                                                <p className="text-[10px] text-red-500 font-medium">{item.stock_quantity} left in stock</p>
                                            </div>
                                            <Button variant="link" className="p-0 h-auto text-[10px] text-red-700 font-bold shrink-0" asChild>
                                                <Link to="/vendor/products">Restock</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Essential Tools</h4>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100 hover:bg-green-50 transition-colors cursor-pointer group/item" onClick={() => navigate('/vendor/payouts')}>
                                    <div className="p-2 bg-white rounded-xl text-green-600 shadow-sm border border-gray-100 group-hover/item:border-green-200">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Withdraw Funds</p>
                                        <p className="text-[11px] font-medium text-gray-400">Request payout to bank</p>
                                    </div>
                                    <ChevronRight className="ml-auto h-4 w-4 text-gray-300 group-hover/item:text-green-400 transition-colors" />
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group/item">
                                    <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm border border-gray-100 group-hover/item:border-blue-200">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Policy Manual</p>
                                        <p className="text-[11px] font-medium text-gray-400">Vendor help guidelines</p>
                                    </div>
                                    <ChevronRight className="ml-auto h-4 w-4 text-gray-300 group-hover/item:text-blue-400 transition-colors" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VendorDashboard;
