import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/api-client';
import { ArrowLeft, UserPlus, Shield, User, Store, GraduationCap, Eye, EyeOff } from 'lucide-react';

const AdminCreateUser = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('user');

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        phone_number: '',
        password: '',
        role: 'user',
        // Pandit fields
        expertise: '',
        experience_years: 0,
        bio: '',
        // Vendor fields
        shop_name: '',
        business_type: 'Ritual Samagri',
        address: '',
        city: '',
        bank_account_number: '',
        bank_name: '',
        account_holder_name: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'experience_years' ? parseInt(value) || 0 : value 
        }));
    };

    const handleRoleChange = (value: string) => {
        setRole(value);
        setFormData(prev => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axiosInstance.post('/users/admin/users/create/', formData);
            toast({
                title: "Success",
                description: response.data.message || "User created successfully",
            });
            navigate('/admin/users');
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorMessage = "Failed to create user. Please check the form.";
            
            if (errorData) {
                if (typeof errorData === 'string') errorMessage = errorData;
                else if (errorData.error) errorMessage = errorData.error;
                else if (errorData.detail) errorMessage = errorData.detail;
                else {
                    // Collect first error from each field
                    const fieldErrors = Object.entries(errorData)
                        .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                        .join('\n');
                    if (fieldErrors) errorMessage = fieldErrors;
                }
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Users
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Account</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-orange-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-orange-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>Account Details</CardTitle>
                                    <CardDescription>Enter the basic information for the new account.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input 
                                        id="full_name" 
                                        name="full_name" 
                                        placeholder="E.g. Rajesh Sharma" 
                                        required 
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        className="focus-visible:ring-orange-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        type="email" 
                                        placeholder="E.g. rajesh@example.com" 
                                        required 
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="focus-visible:ring-orange-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input 
                                        id="phone_number" 
                                        name="phone_number" 
                                        placeholder="E.g. 9841234567" 
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className="focus-visible:ring-orange-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Initial Password *</Label>
                                    <div className="relative">
                                        <Input 
                                            id="password" 
                                            name="password" 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Set a strong password" 
                                            required 
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="focus-visible:ring-orange-500 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Assign Role *</Label>
                                    <Select value={role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className="focus:ring-orange-500">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-500" />
                                                    <span>Customer</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="pandit">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-orange-500" />
                                                    <span>Pandit</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="vendor">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-blue-500" />
                                                    <span>Vendor</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-red-500" />
                                                    <span>Admin</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Pandit Specific Fields */}
                            {role === 'pandit' && (
                                <div className="space-y-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5" /> Pandit Professional Info
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="expertise">Expertise</Label>
                                            <Input 
                                                id="expertise" 
                                                name="expertise" 
                                                placeholder="E.g. Vedic Rituals, Marriage" 
                                                value={formData.expertise}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="experience_years">Years of Experience</Label>
                                            <Input 
                                                id="experience_years" 
                                                name="experience_years" 
                                                type="number" 
                                                placeholder="0" 
                                                value={formData.experience_years}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="bio">Professional Bio</Label>
                                            <Textarea 
                                                id="bio" 
                                                name="bio" 
                                                placeholder="Tell us about the pandit's background..." 
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500 min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Vendor Specific Fields */}
                            {role === 'vendor' && (
                                <div className="space-y-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                                        <Store className="h-5 w-5" /> Shop & Bank Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="shop_name">Shop Name *</Label>
                                            <Input 
                                                id="shop_name" 
                                                name="shop_name" 
                                                placeholder="E.g. Puja Samagri Store" 
                                                required={role === 'vendor'}
                                                value={formData.shop_name}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="business_type">Business Type</Label>
                                            <Input 
                                                id="business_type" 
                                                name="business_type" 
                                                placeholder="E.g. Retail, Wholesale" 
                                                value={formData.business_type}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input 
                                                id="city" 
                                                name="city" 
                                                placeholder="E.g. Kathmandu" 
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Full Address</Label>
                                            <Input 
                                                id="address" 
                                                name="address" 
                                                placeholder="E.g. New Road, Ward 4" 
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_name">Bank Name</Label>
                                            <Input 
                                                id="bank_name" 
                                                name="bank_name" 
                                                placeholder="E.g. Nabil Bank" 
                                                value={formData.bank_name}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account_number">Bank Account Number</Label>
                                            <Input 
                                                id="bank_account_number" 
                                                name="bank_account_number" 
                                                placeholder="E.g. 1023940123" 
                                                value={formData.bank_account_number}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="account_holder_name">Account Holder Name</Label>
                                            <Input 
                                                id="account_holder_name" 
                                                name="account_holder_name" 
                                                placeholder="Name as in bank records" 
                                                value={formData.account_holder_name}
                                                onChange={handleInputChange}
                                                className="focus-visible:ring-orange-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default AdminCreateUser;
