import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfile, updateUserProfile, changePassword } from '@/lib/api';
import { User, Camera, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function AdminProfile() {
    const { user, role } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile form
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchProfile();
            setProfile(data);
            setFullName(data.full_name || '');
            setEmail(data.email || '');
            setPhoneNumber(data.phone_number || '');
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleProfileSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const formData = new FormData();
            if (fullName) formData.append('full_name', fullName);
            if (email) formData.append('email', email);
            if (phoneNumber) formData.append('phone_number', phoneNumber);
            if (profilePicFile) {
                formData.append('profile_pic', profilePicFile);
            }
            const updated = await updateUserProfile(formData);
            setProfile(updated);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setProfilePicFile(null);
            setPreviewUrl(null);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPwMessage(null);
        if (newPassword !== confirmPassword) {
            setPwMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setChangingPassword(true);
        try {
            await changePassword({ current_password: currentPassword, new_password: newPassword });
            setPwMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPwMessage({ type: 'error', text: err.message || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    const getAvatarUrl = () => {
        if (previewUrl) return previewUrl;
        if (profile?.profile_pic) {
            return profile.profile_pic.startsWith('http')
                ? profile.profile_pic
                : `${API_BASE}${profile.profile_pic}`;
        }
        return null;
    };

    const displayRole = role === 'superadmin' ? 'Super Admin' : 'Admin';

    if (loading) {
        return (
            <DashboardLayout userRole={role === 'superadmin' ? 'admin' : (role as any)}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole={role === 'superadmin' ? 'admin' : (role as any)}>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account information</p>
                </div>

                {/* Profile Information */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-orange-500" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>Update your personal details and photo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-orange-100">
                                        <AvatarImage src={getAvatarUrl() || undefined} />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                                            {fullName?.charAt(0)?.toUpperCase() || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label
                                        htmlFor="profile-pic"
                                        className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-orange-600 transition-colors"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </label>
                                    <input
                                        id="profile-pic"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{fullName || 'Admin'}</h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        {displayRole}
                                    </span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        placeholder="+977-XXXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input value={displayRole} disabled className="bg-gray-50" />
                                </div>
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

                            <Button onClick={handleProfileSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Password Change */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-orange-500" />
                                Change Password
                            </CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_pw">Current Password</Label>
                                <Input
                                    id="current_pw"
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new_pw">New Password</Label>
                                    <Input
                                        id="new_pw"
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_pw">Confirm New Password</Label>
                                    <Input
                                        id="confirm_pw"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            {pwMessage && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                    pwMessage.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {pwMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {pwMessage.text}
                                </div>
                            )}

                            <Button
                                onClick={handlePasswordChange}
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                {changingPassword ? 'Changing...' : 'Change Password'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
