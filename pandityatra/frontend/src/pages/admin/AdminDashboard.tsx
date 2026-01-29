

import React, { useEffect, useState } from 'react';
import { fetchAdminStats } from '@/lib/api';
import type { AdminStats } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle, UserCheck, Bug } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    const [stats, setStats] = useState<AdminStats | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAdminStats().then(setStats).catch(console.error);
    }, []);

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <span className="text-muted-foreground">Logged in as {user?.full_name || 'Admin'}</span>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader>
                            <Users className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Total Users</CardTitle>
                            <CardDescription>Registered accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                            <p className="text-xs text-muted-foreground">Including Pandits</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <UserCheck className="h-8 w-8 text-blue-500 mb-2" />
                            <CardTitle>Total Pandits</CardTitle>
                            <CardDescription>Verified & Pending</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_pandits || 0}</div>
                            <p className="text-xs text-muted-foreground">Service Providers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                            <CardTitle>Pending Verifications</CardTitle>
                            <CardDescription>Action Required</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pending_verifications || 0}</div>
                            <p className="text-xs text-muted-foreground">Profiles awaiting approval</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/admin/AdminErrorLogs')}>
                        <CardHeader>
                            <Bug className="h-8 w-8 text-red-500 mb-2" />
                            <CardTitle>Error Logs</CardTitle>
                            <CardDescription>Payment & Booking Issues</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">Review</div>
                            <p className="text-xs text-muted-foreground">See all unresolved errors</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bookings & Revenue Trend</CardTitle>
                        <CardDescription>Monthly analytics overview</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sampleChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Revenue', angle: 90, position: 'insideRight' }} />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} name="Bookings" />
                                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue (₹)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Activity Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">No recent activity logs.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
