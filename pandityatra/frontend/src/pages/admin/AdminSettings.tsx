import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
    commission_rate: string;
    video_call_rate_per_min: string;
}

const AdminSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformSettings>({
        commission_rate: '',
        video_call_rate_per_min: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axiosInstance.get('/users/admin/settings/');
            setSettings(res.data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/users/admin/settings/', settings);
            toast({
                title: "Settings Updated",
                description: "Platform settings have been saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold">Platform Configuration</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Global Rates & Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="commission_rate">Platform Commission (%)</Label>
                                <Input 
                                    id="commission_rate"
                                    name="commission_rate"
                                    type="number" 
                                    step="0.01" 
                                    value={settings.commission_rate}
                                    onChange={handleChange}
                                    placeholder="10.00"
                                />
                                <p className="text-sm text-gray-500">
                                    Percentage of each booking deducted as platform fee.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="video_call_rate_per_min">Default Video Call Rate (NPR/min)</Label>
                                <Input 
                                    id="video_call_rate_per_min"
                                    name="video_call_rate_per_min"
                                    type="number" 
                                    step="0.01"
                                    value={settings.video_call_rate_per_min}
                                    onChange={handleChange}
                                    placeholder="15.00"
                                />
                                <p className="text-sm text-gray-500">
                                    Base rate for video consultations if not set by Pandit.
                                </p>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminSettings;
