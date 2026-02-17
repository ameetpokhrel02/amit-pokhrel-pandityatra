import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { Loader2, Camera, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const EditProfile = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            // If user has a profile pic, set it as preview
            if (user.profile_pic) {
                setPreviewUrl(user.profile_pic);
            }
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('email', formData.email);
            data.append('phone_number', formData.phone_number);

            if (selectedFile) {
                data.append('profile_pic', selectedFile);
            }

            await apiClient.patch('/users/profile/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast({ title: 'Success', description: 'Profile updated successfully' });
            refreshUser();
            setSelectedFile(null); // Clear selected file after success
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
        <form onSubmit={handleSubmit} className="space-y-8 max-w-lg">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-6 pb-4 border-b border-orange-50">
                <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-1 ring-orange-100">
                        <AvatarImage src={previewUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-orange-50 text-orange-200">
                            <UserIcon className="w-16 h-16" />
                        </AvatarFallback>
                    </Avatar>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-[#FF6F00] text-white rounded-full shadow-lg hover:bg-orange-700 transition-all scale-90 group-hover:scale-100"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
                <div className="text-center sm:text-left space-y-1">
                    <h3 className="font-bold text-[#3E2723]">Profile Photo</h3>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG or WEBP. Max 2MB.
                    </p>
                    <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-[#FF6F00] font-bold text-xs"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Change Photo
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-[#3E2723]/60">Full Name</Label>
                    <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        className="rounded-xl border-orange-100 focus:ring-orange-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-[#3E2723]/60">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="rounded-xl border-orange-100 focus:ring-orange-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-xs font-black uppercase tracking-widest text-[#3E2723]/60">Phone Number</Label>
                    <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        required
                        className="rounded-xl border-orange-100 focus:ring-orange-200"
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#FF6F00] hover:bg-orange-700 rounded-xl px-8 shadow-lg shadow-orange-200">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    );
};
