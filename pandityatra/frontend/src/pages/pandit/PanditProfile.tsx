import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { updatePanditProfile } from '@/lib/api';
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
} from "@/components/ui/form"

const profileFormSchema = z.object({
    full_name: z.string().min(2, {
        message: "Full name must be at least 2 characters.",
    }),
    phone_number: z.string().min(10, {
        message: "Phone number must be at least 10 digits.",
    }),
    expertise: z.string().min(2, {
        message: "Expertise must be at least 2 characters.",
    }),
    language: z.string().min(2, {
        message: "Language must be at least 2 characters.",
    }),
    experience_years: z.coerce.number().min(0, {
        message: "Experience must be a positive number.",
    }),
    bio: z.string().max(500, {
        message: "Bio must not be longer than 500 characters.",
    }).min(10, {
        message: "Bio must be at least 10 characters.",
    }),
    profile_pic: z.any().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>


const PanditProfile = () => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues: {
        full_name: user?.full_name || "",
        phone_number: user?.phone_number || "",
        expertise: user?.pandit_profile?.expertise || "",
        language: user?.pandit_profile?.language || "",
        experience_years: user?.pandit_profile?.experience_years || 0,
        bio: user?.pandit_profile?.bio || "",
    },
    mode: "onChange",
  })


  useEffect(() => {
    if (user) {
        form.reset({
            full_name: user.full_name || "",
            phone_number: user.phone_number || "",
            expertise: user.pandit_profile?.expertise || "",
            language: user.pandit_profile?.language || "",
            experience_years: user.pandit_profile?.experience_years || 0,
            bio: user.pandit_profile?.bio || "",
        });
        setPhotoPreview(user.profile_pic_url || null);
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

  async function onSubmit(data: ProfileFormValues) {
    if (!user || (!user.pandit_profile && user.role !== 'pandit')) {
        toast({
            title: "Error",
            description: "Not authenticated or no pandit profile found.",
            variant: "destructive",
        });
        return;
    }

    setIsSaving(true);
    try {
        const formData = new FormData();
        const panditId = user.pandit_profile?.id || user.id; // Correctly get ID

        
        // Append fields that have changed
        if (data.full_name !== user.full_name) {
            formData.append('user_data.full_name', data.full_name);
        }
        if (data.phone_number !== user.phone_number) {
            formData.append('user_data.phone_number', data.phone_number);
        }
        if (data.expertise !== user.pandit_profile.expertise) {
            formData.append('expertise', data.expertise);
        }
        if (data.language !== user.pandit_profile.language) {
            formData.append('language', data.language);
        }
        if (data.experience_years !== user.pandit_profile.experience_years) {
            formData.append('experience_years', String(data.experience_years));
        }
        if (data.bio !== user.pandit_profile.bio) {
            formData.append('bio', data.bio);
        }
        if (data.profile_pic instanceof File) {
            formData.append('user_data.profile_pic', data.profile_pic);
        }

        // Just blindly call api if we have any data, or even just for simple text updates.
        // The check was too strict if user just clicked save.
        
        // Use user.pandit_profile.id if available, otherwise assume we might need to handle it differently
        // but for now, let's rely on the existence of the profile.
        if (user.pandit_profile) {
             const updatedPandit = await updatePanditProfile(user.pandit_profile.id, formData);
        } else {
             // Fallback if somehow user is pandit but no profile loaded yet? 
             // Ideally shouldn't happen if role is pandit.
             throw new Error("Pandit Profile ID missing");
        }

        // Update user context
        if (refreshUser) {
            await refreshUser();
        }

        toast({
            title: "Success",
            description: "Your profile has been updated successfully.",
        });
    } catch (error) {
        console.error("Profile update failed:", error);
        toast({
            title: "Update Failed",
            description: "Could not update your profile. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <DashboardLayout userRole="pandit">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information and expertise.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Photo Upload Section */}
                        <div className="flex flex-col items-center gap-4 mb-4">
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-gray-100">
                                    <AvatarImage src={photoPreview || ""} className="object-cover" />
                                    <AvatarFallback className="text-4xl text-gray-400">
                                        {user?.full_name?.[0] || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <label 
                                    htmlFor="photo-upload" 
                                    className="absolute -bottom-2 -right-2 cursor-pointer bg-orange-600 text-white rounded-full p-2 hover:bg-orange-700 transition-colors"
                                >
                                    <Camera size={20} />
                                </label>
                                <Input 
                                    id="photo-upload" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={handlePhotoChange} 
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Allowed: JPG, PNG. Max size: 2MB</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Rajesh Shastri" {...field} />
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
                                        <Input placeholder="+977" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} placeholder="email@example.com" disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Professional Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="expertise"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Expertise (Comma separated)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Vastu, Astrology, Wedding" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Languages</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Hindi, Sanskrit, English" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="experience_years"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="5" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Tell us about yourself..." className="h-32" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </Form>
    </DashboardLayout>
  )
}

export default PanditProfile
