import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
    fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
    type AdminUser,
} from '@/lib/api';
import {
    Shield, UserPlus, Trash2, ToggleLeft, ToggleRight,
    Crown, CheckCircle, AlertCircle, X, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ManageAdmins() {
    const { user, role } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Create form state
    const [newEmail, setNewEmail] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const data = await fetchAdminUsers();
            setAdmins(data);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to load admins' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newEmail || !newPassword) {
            setMessage({ type: 'error', text: 'Email and password are required' });
            return;
        }
        setCreating(true);
        setMessage(null);
        try {
            await createAdminUser({
                email: newEmail,
                full_name: newFullName,
                phone_number: newPhone,
                password: newPassword,
                role: newRole,
            });
            setMessage({ type: 'success', text: 'Admin created successfully!' });
            setShowCreateForm(false);
            setNewEmail('');
            setNewFullName('');
            setNewPhone('');
            setNewPassword('');
            setNewRole('admin');
            loadAdmins();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to create admin' });
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (adminId: number) => {
        try {
            await updateAdminUser(adminId, { action: 'toggle_status' });
            loadAdmins();
            setMessage({ type: 'success', text: 'Status toggled successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to toggle status' });
        }
    };

    const handleDelete = async (adminId: number, adminName: string) => {
        if (!window.confirm(`Are you sure you want to delete admin "${adminName}"? This cannot be undone.`)) return;
        try {
            await deleteAdminUser(adminId);
            loadAdmins();
            setMessage({ type: 'success', text: 'Admin deleted successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete admin' });
        }
    };

    const handleRoleChange = async (adminId: number, newRole: string) => {
        try {
            await updateAdminUser(adminId, { action: 'change_role', role: newRole });
            loadAdmins();
            setMessage({ type: 'success', text: 'Role updated successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to change role' });
        }
    };

    const superadminCount = admins.filter(a => a.role === 'superadmin').length;
    const adminCount = admins.filter(a => a.role === 'admin').length;

    if (loading) {
        return (
            <DashboardLayout userRole="admin">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole="admin">
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
                        <p className="text-gray-500 mt-1">Add, remove, and manage administrator accounts</p>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        {showCreateForm ? <X className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        {showCreateForm ? 'Cancel' : 'Add Admin'}
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-100">
                                    <Crown className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Super Admins</p>
                                    <p className="text-2xl font-bold">{superadminCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-100">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Regular Admins</p>
                                    <p className="text-2xl font-bold">{adminCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-orange-100">
                                    <Users className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Admins</p>
                                    <p className="text-2xl font-bold">{admins.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}

                {/* Create Admin Form */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-orange-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-orange-500" />
                                        Create New Admin
                                    </CardTitle>
                                    <CardDescription>Add a new administrator to the system</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={newFullName}
                                                onChange={e => setNewFullName(e.target.value)}
                                                placeholder="Admin's full name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email *</Label>
                                            <Input
                                                type="email"
                                                value={newEmail}
                                                onChange={e => setNewEmail(e.target.value)}
                                                placeholder="admin@email.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={newPhone}
                                                onChange={e => setNewPhone(e.target.value)}
                                                placeholder="+977-XXXXXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password *</Label>
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <select
                                                value={newRole}
                                                onChange={e => setNewRole(e.target.value as 'admin' | 'superadmin')}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="superadmin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button onClick={handleCreate} disabled={creating} className="bg-orange-500 hover:bg-orange-600">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {creating ? 'Creating...' : 'Create Admin'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Admin List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Administrators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {admins.map((admin, idx) => {
                                const isCurrentUser = admin.id === user?.id;
                                const avatarUrl = admin.profile_pic
                                    ? (admin.profile_pic.startsWith('http') ? admin.profile_pic : `${API_BASE}${admin.profile_pic}`)
                                    : null;

                                return (
                                    <motion.div
                                        key={admin.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${
                                            !admin.is_active ? 'bg-gray-50 opacity-60' : 'bg-white'
                                        } ${isCurrentUser ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={avatarUrl || undefined} />
                                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                                    {admin.full_name?.charAt(0)?.toUpperCase() || 'A'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">
                                                        {admin.full_name || admin.email}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                    {admin.role === 'superadmin' ? (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Crown className="h-3 w-3" /> Super Admin
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Shield className="h-3 w-3" /> Admin
                                                        </span>
                                                    )}
                                                    {!admin.is_active && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{admin.email} {admin.phone_number ? `• ${admin.phone_number}` : ''}</p>
                                                <p className="text-xs text-gray-400">Joined {new Date(admin.date_joined).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {!isCurrentUser && (
                                            <div className="flex items-center gap-2">
                                                {/* Toggle Role */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRoleChange(admin.id, admin.role === 'admin' ? 'superadmin' : 'admin')}
                                                    title={admin.role === 'admin' ? 'Promote to Super Admin' : 'Demote to Admin'}
                                                >
                                                    <Crown className={`h-4 w-4 ${admin.role === 'superadmin' ? 'text-purple-500' : 'text-gray-400'}`} />
                                                </Button>
                                                {/* Toggle Status */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(admin.id)}
                                                    title={admin.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {admin.is_active ? (
                                                        <ToggleRight className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4 text-red-500" />
                                                    )}
                                                </Button>
                                                {/* Delete */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(admin.id, admin.full_name || admin.email)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}

                            {admins.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No admins found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
