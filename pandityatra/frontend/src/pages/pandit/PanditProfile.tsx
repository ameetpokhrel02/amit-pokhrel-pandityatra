import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

const PanditProfile = () => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardLayout userRole="pandit">
        <div className="space-y-6 max-w-2xl">
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
                                <AvatarFallback className="text-4xl text-gray-400">P</AvatarFallback>
                            </Avatar>
                            <label 
                                htmlFor="photo-upload" 
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-md active:scale-95"
                                title="Upload Photo"
                            >
                                <Camera className="h-5 w-5" />
                                <input 
                                    id="photo-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handlePhotoChange}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-muted-foreground">Allowed: JPG, PNG. Max size: 2MB</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input placeholder="Pandit Name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input placeholder="+977 " />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input placeholder="email@example.com" disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Professional Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Expertise (Comma separated)</Label>
                        <Input placeholder="e.g. Vastu, Astrology, Wedding" />
                    </div>
                    <div className="space-y-2">
                        <Label>Languages</Label>
                        <Input placeholder="e.g. Hindi, Sanskrit, English" />
                    </div>
                    <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input type="number" placeholder="5" />
                    </div>
                    <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea placeholder="Tell us about yourself..." className="h-32" />
                    </div>
                    
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
    </DashboardLayout>
  )
}

export default PanditProfile
