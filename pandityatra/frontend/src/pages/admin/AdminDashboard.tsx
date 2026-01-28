import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Users, AlertTriangle, CheckCircle, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { fetchAdminStats } from '@/lib/api';
import type { AdminStats } from '@/lib/api';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = React.useState<AdminStats | null>(null);

    React.useEffect(() => {
        fetchAdminStats().then(setStats).catch(console.error);
    }, []);

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <span className="text-muted-foreground">Logged in as {user?.full_name || 'Admin'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>

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
