import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { updateUserProfile, updatePanditProfile, fetchPandits } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const EditProfile: React.FC = () => {
    const { user } = useAuth(); // Removed login destructuring
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Common Fields
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Pandit Specific Fields
    const [panditId, setPanditId] = useState<number | null>(null);
    const [language, setLanguage] = useState('');
    const [expertise, setExpertise] = useState('');
    const [bio, setBio] = useState('');
    const [experience, setExperience] = useState('0');

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setEmail(user.email);

            if (user.role === 'pandit') {
                // Fetch Pandit details to pre-fill
                // Since we don't store panditId in user object, we might need to fetch "my profile"
                // For now, let's fetch all (filtered by backend logic) or assuming we can find it
                // A better way: fetchPandits() returns list, if user is pandit, list has 1 item
                fetchPandits().then(pandits => {
                    const myProfile = pandits[0]; // Backend logic ensures pandits see only their own
                    if (myProfile) {
                        setPanditId(myProfile.id);
                        setLanguage(myProfile.language || '');
                        setExpertise(myProfile.expertise || '');
                        setBio(myProfile.bio || '');
                        setExperience(String(myProfile.experience_years));
                    }
                });
            }
        }
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Update User Basic Info
            await updateUserProfile({
                full_name: fullName,
                email: email
            });

            // Update local user state if possible (requires refetching or manually updating context)
            // Ideally useAuth provides a way to refresh user, but for now we won't break it.

            // 2. Update Pandit Profile if applicable
            if (user?.role === 'pandit' && panditId) {
                await updatePanditProfile(panditId, {
                    language,
                    expertise,
                    bio,
                    experience_years: parseInt(experience)
                });
            }

            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout userRole={user?.role as any}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Profile</h1>
                    <p className="text-muted-foreground">Update your personal information</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                        <CardDescription>Basic account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input value={user?.phone_number || ''} disabled className="bg-muted" />
                            <span className="text-xs text-muted-foreground">Phone number cannot be changed.</span>
                        </div>
                    </CardContent>
                </Card>

                {user?.role === 'pandit' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pandit Profile</CardTitle>
                            <CardDescription>Professional details visible to customers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="language">Languages (e.g., Hindi, English)</Label>
                                <Input
                                    id="language"
                                    value={language}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
                                    placeholder="Enter languages known"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expertise">Expertise</Label>
                                <Input
                                    id="expertise"
                                    value={expertise}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpertise(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Experience (Years)</Label>
                                    <Input
                                        id="experience"
                                        type="number"
                                        value={experience}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExperience(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                        Save Changes
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditProfile;
