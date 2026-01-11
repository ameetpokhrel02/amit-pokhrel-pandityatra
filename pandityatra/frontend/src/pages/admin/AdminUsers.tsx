import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface User {
    id: number;
    phone_number: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    date_joined: string;
}

const AdminUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get('/users/admin/users/');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const res = await axiosInstance.post(`/users/admin/users/${userId}/toggle-status/`);
            toast({ title: "Success", description: res.data.message });
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        } catch (error) {
            toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <Badge variant="outline">Total: {users.length}</Badge>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registered Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone / Email</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No users found.</TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>#{user.id}</TableCell>
                                            <TableCell>{user.full_name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{user.phone_number || '-'}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(user.date_joined), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? "default" : "destructive"}>
                                                    {user.is_active ? 'Active' : 'Blocked'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant={user.is_active ? "destructive" : "outline"}
                                                    size="sm"
                                                    onClick={() => toggleStatus(user.id, user.is_active)}
                                                >
                                                    {user.is_active ? 'Block' : 'Unblock'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminUsers;
