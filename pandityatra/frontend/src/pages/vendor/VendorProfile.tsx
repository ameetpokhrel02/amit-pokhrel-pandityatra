import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Store, Building2, MapPin, Landmark, User as UserIcon, FileText } from "lucide-react"
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { updateVendorProfile, registerVendor } from '@/lib/api';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const vendorProfileSchema = z.object({
    full_name: z.string().min(2, {
        message: "Full name must be at least 2 characters.",
    }),
    phone_number: z.string().min(10, {
        message: "Phone number must be at least 10 digits.",
    }),
    shop_name: z.string().min(2, {
        message: "Shop name must be at least 2 characters.",
    }),
    business_type: z.string().min(1, {
        message: "Please select a business type.",
    }),
    address: z.string().min(5, {
        message: "Address must be at least 5 characters.",
    }),
    city: z.string().min(2, {
        message: "City must be at least 2 characters.",
    }),
    bio: z.string().max(500).optional(),
    bank_name: z.string().min(2, {
        message: "Bank name is required.",
    }),
    bank_account_number: z.string().min(5, {
        message: "Account number is required.",
    }),
    account_holder_name: z.string().min(2, {
        message: "Account holder name is required.",
    }),
    profile_pic: z.any().optional(),
    id_proof: z.any().optional(),
})

type VendorProfileValues = z.infer<typeof vendorProfileSchema>

const VendorProfile = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const form = useForm<VendorProfileValues>({
        resolver: zodResolver(vendorProfileSchema) as any,
        defaultValues: {
            full_name: user?.full_name || "",
            phone_number: user?.phone_number || "",
            shop_name: user?.vendor_profile?.shop_name || "",
            business_type: user?.vendor_profile?.business_type || "",
            address: user?.vendor_profile?.address || "",
            city: user?.vendor_profile?.city || "",
            bio: user?.vendor_profile?.bio || "",
            bank_name: user?.vendor_profile?.bank_name || "",
            bank_account_number: user?.vendor_profile?.bank_account_number || "",
            account_holder_name: user?.vendor_profile?.account_holder_name || "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                full_name: user.full_name || "",
                phone_number: user.phone_number || "",
                shop_name: user.vendor_profile?.shop_name || "",
                business_type: user.vendor_profile?.business_type || "",
                address: user.vendor_profile?.address || "",
                city: user.vendor_profile?.city || "",
                bio: user.vendor_profile?.bio || "",
                bank_name: user.vendor_profile?.bank_name || "",
                bank_account_number: user.vendor_profile?.bank_account_number || "",
                account_holder_name: user.vendor_profile?.account_holder_name || "",
            });
            setPhotoPreview(user.profile_pic || null);
        }
    }, [user, form]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            form.setValue('profile_pic', file);
        }
    };

    async function onSubmit(data: VendorProfileValues) {
        // Note: New vendors might not have a vendor_profile.id yet.
        // We will 'Register' them if missing, and 'Update' if present.
        const isNewVendor = !user?.vendor_profile?.id;

        setIsSaving(true);
        try {
            const formData = new FormData();
            
            // User fields
            formData.append('full_name', data.full_name);
            formData.append('phone_number', data.phone_number);
            if (data.profile_pic instanceof File) {
                formData.append('profile_pic', data.profile_pic);
            }

            // Vendor fields
            formData.append('shop_name', data.shop_name);
            formData.append('business_type', data.business_type);
            formData.append('address', data.address);
            formData.append('city', data.city);
            formData.append('bio', data.bio || "");
            formData.append('bank_name', data.bank_name);
            formData.append('bank_account_number', data.bank_account_number);
            formData.append('account_holder_name', data.account_holder_name);

            if (data.id_proof instanceof File) {
                formData.append('id_proof', data.id_proof);
            }

            const uploadToastId = toast({
                title: "Synchronizing with Cloudinary...",
                description: "Updating your shop profile and securely storing media.",
                duration: Infinity,
            }).id;

            if (isNewVendor) {
                await registerVendor(formData);
            } else {
                await updateVendorProfile(user.vendor_profile.id, formData);
            }
            
            if (refreshUser) await refreshUser();

            toast({
                title: isNewVendor ? "Profile Created" : "Profile Updated",
                description: isNewVendor 
                    ? "Your shop profile has been uploaded to Cloudinary and is now under review." 
                    : "Your shop profile has been synced with Cloudinary successfully.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "There was an error saving your profile.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <DashboardLayout userRole="vendor">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop Profile</h1>
                    <p className="text-muted-foreground">Manage your business information and verification documents.</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Status Alert if not verified */}
                        {user?.vendor_profile?.verification_status !== 'APPROVED' && (
                            <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                                user?.vendor_profile?.verification_status === 'REJECTED' 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                                <FileText className="mt-1" size={20} />
                                <div>
                                    <p className="font-bold">
                                        Status: {user?.vendor_profile?.verification_status || 'PENDING'}
                                    </p>
                                    <p className="text-sm opacity-90">
                                        Your account is currently under review. Please ensure all details below are accurate to speed up the process.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Personal & Photo */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <UserIcon size={18} />
                                            Owner Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                                    <AvatarImage src={photoPreview || ""} className="object-cover" />
                                                    <AvatarFallback className="text-4xl">
                                                        {user?.full_name?.[0] || 'V'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 cursor-pointer bg-orange-600 text-white rounded-full p-2 hover:bg-orange-700 transition-colors shadow-md">
                                                    <Camera size={20} />
                                                </label>
                                                <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-center">Profile picture helps build trust with customers.</p>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="full_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="+977" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={user?.email || ""} disabled className="bg-slate-50" />
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Email cannot be changed</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Middle Column: Business Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Store size={18} />
                                            Business Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="shop_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="e.g. Om Samagri Bhandar" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="business_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Samagri Store">Samagri Store</SelectItem>
                                                            <SelectItem value="Books & Literature">Books & Literature</SelectItem>
                                                            <SelectItem value="Handicrafts">Handicrafts</SelectItem>
                                                            <SelectItem value="Clothing">Clothing</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Full address" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Business Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            {...field} 
                                                            placeholder="Tell customers about your shop..." 
                                                            className="h-24 resize-none"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Max 500 characters.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Landmark size={18} />
                                            Bank & Verification
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="bank_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bank Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="account_holder_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Account Holder Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="bank_account_number"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>Account Number</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="pt-4 border-t">
                                            <FormField
                                                control={form.control}
                                                name="id_proof"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            Identity Proof (Citizenship/VAT/PAN)
                                                            <span className="text-red-500 font-bold">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="mt-2 text-center">
                                                                <Input
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        field.onChange(file || undefined);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription>
                                                            {user?.vendor_profile?.id_proof ? (
                                                                <span className="text-green-600 font-medium">✓ Document already uploaded. Upload new to replace.</span>
                                                            ) : (
                                                                "Required for verification. PDF or Image allowed."
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end gap-4">
                                    <Button 
                                        type="submit" 
                                        size="lg" 
                                        className="rounded-xl px-10 font-bold bg-orange-600 hover:bg-orange-700 h-16"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving Progress..." : "Save Shop Profile"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </DashboardLayout>
    )
}

export default VendorProfile
