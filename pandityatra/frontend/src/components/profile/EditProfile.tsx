import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export const EditProfile = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.patch('/users/me/', formData);
            toast({ title: 'Success', description: 'Profile updated successfully' });
            refreshUser();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to update profile',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    required
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    );
};
