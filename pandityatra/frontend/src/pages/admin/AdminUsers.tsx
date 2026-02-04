import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { DataTablePagination } from "@/components/common/DataTablePagination";

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
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ full_name: string; email: string; role: string }>({ full_name: "", email: "", role: "user" });

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
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        } catch (error) {
            toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const filteredUsers = users.filter(u =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEdit = (user: User) => {
        setEditId(user.id);
        setEditForm({ full_name: user.full_name, email: user.email, role: user.role });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.put(`/users/admin/users/${editId}/`, editForm);
            toast({ title: "Success", description: "User updated" });
            setEditId(null);
            fetchUsers();
        } catch {
            toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Delete this user?")) {
            try {
                await axiosInstance.delete(`/users/admin/users/${id}/`);
                toast({ title: "Deleted", description: "User deleted" });
                fetchUsers();
            } catch {
                toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
            }
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <span className="text-muted-foreground">Total: {users.length}</span>
                </div>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Search & Manage Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input type="text" placeholder="Search users..." value={search} onChange={handleSearch} className="mb-4 p-2 border rounded w-full max-w-md" />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No users found.</TableCell>
                                    </TableRow>
                                ) : (
                                    currentUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>#{user.id}</TableCell>
                                            <TableCell>
                                                {editId === user.id ? (
                                                    <input name="full_name" value={editForm.full_name} onChange={handleEditChange} className="p-1 border rounded" />
                                                ) : user.full_name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {editId === user.id ? (
                                                    <input name="email" value={editForm.email} onChange={handleEditChange} className="p-1 border rounded" />
                                                ) : user.email}
                                            </TableCell>
                                            <TableCell>
                                                {editId === user.id ? (
                                                    <input name="role" value={editForm.role} onChange={handleEditChange} className="p-1 border rounded" />
                                                ) : user.role}
                                            </TableCell>
                                            <TableCell>
                                                <span className={user.is_active ? "text-green-600" : "text-red-600"}>{user.is_active ? 'Active' : 'Blocked'}</span>
                                            </TableCell>
                                            <TableCell>{format(new Date(user.date_joined), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>
                                                {editId === user.id ? (
                                                    <>
                                                        <Button size="sm" onClick={handleEditSubmit}>Save</Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>Edit</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>Delete</Button>
                                                        <Button size="sm" variant={user.is_active ? "destructive" : "outline"} onClick={() => toggleStatus(user.id, user.is_active)}>
                                                            {user.is_active ? 'Block' : 'Unblock'}
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <DataTablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminUsers;
