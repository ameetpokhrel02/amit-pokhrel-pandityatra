import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { Pencil, Trash2, UserX, UserCheck, Check, X, UserPlus } from 'lucide-react';
import { ActionConfirmationDialog } from "@/components/common/ActionConfirmationDialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const navigate = useNavigate();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ full_name: string; email: string; role: string }>({ full_name: "", email: "", role: "user" });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; onConfirm: () => void }>({
        title: "",
        description: "",
        onConfirm: () => { }
    });

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
        setConfirmConfig({
            title: currentStatus ? "Block User?" : "Unblock User?",
            description: `Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this user? ${currentStatus ? 'They will not be able to log in until unblocked.' : 'They will regain access to the platform.'}`,
            onConfirm: async () => {
                try {
                    const res = await axiosInstance.post(`/users/admin/users/${userId}/toggle-status/`);
                    toast({ title: "Success", description: res.data.message });
                    setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
                    setConfirmOpen(false);
                } catch (error) {
                    toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
                }
            }
        });
        setConfirmOpen(true);
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
        setConfirmConfig({
            title: "Delete User?",
            description: "Are you sure you want to delete this user? This action cannot be undone and will remove all their data from our system.",
            onConfirm: async () => {
                try {
                    await axiosInstance.delete(`/users/admin/users/${id}/`);
                    toast({ title: "Deleted", description: "User deleted" });
                    fetchUsers();
                    setConfirmOpen(false);
                } catch {
                    toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
                }
            }
        });
        setConfirmOpen(true);
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate('/admin/users/create')} className="bg-orange-600 hover:bg-orange-700">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                        <span className="text-muted-foreground font-medium">Total: {users.length}</span>
                    </div>
                </div>
                <TooltipProvider>
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
                                                <div className="flex items-center gap-2">
                                                    {editId === user.id ? (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleEditSubmit}>
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Save</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setEditId(null)}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Cancel</TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(user)}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit User</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete User</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className={`h-8 w-8 p-0 ${user.is_active ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`} 
                                                                        onClick={() => toggleStatus(user.id, user.is_active)}
                                                                    >
                                                                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{user.is_active ? 'Block User' : 'Unblock User'}</TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </div>
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
                </TooltipProvider>
                <ActionConfirmationDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    onConfirm={confirmConfig.onConfirm}
                />
            </div>
        </DashboardLayout>
    );
};

export default AdminUsers;
