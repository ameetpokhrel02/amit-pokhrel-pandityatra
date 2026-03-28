import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
    Bell, 
    Lock, 
    Store, 
    CreditCard, 
    ShieldCheck, 
    CircleHelp,
    Loader2,
    Save
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchVendorStats, updateVendorProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function VendorSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        is_accepting_orders: true,
        auto_approve_orders: false,
        notification_email: "",
        is_low_stock_alert_enabled: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stats = await fetchVendorStats();
                setSettings({
                    is_accepting_orders: stats.is_accepting_orders ?? true,
                    auto_approve_orders: stats.auto_approve_orders ?? false,
                    notification_email: stats.notification_email ?? user?.email ?? "",
                    is_low_stock_alert_enabled: stats.is_low_stock_alert_enabled ?? true
                });
            } catch (err) {
                toast({ title: "Error", description: "Failed to load shop settings.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user?.vendor_profile_id) return;
        setSaving(true);
        try {
            await updateVendorProfile(user.vendor_profile_id, settings);
            toast({ title: "Settings Saved", description: "Your shop preferences have been updated." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout userRole="vendor">
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole="vendor">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                        <p className="text-muted-foreground">Manage your shop preferences and account security</p>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-[200px_1fr]">
                    {/* Settings Sidebar */}
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start text-orange-600 bg-orange-50 font-bold">
                            <Store className="mr-2 h-4 w-4" /> Shop Info
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-orange-600 hover:bg-orange-50">
                            <Bell className="mr-2 h-4 w-4" /> Notifications
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-orange-600 hover:bg-orange-50">
                            <Lock className="mr-2 h-4 w-4" /> Security
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-orange-600 hover:bg-orange-50">
                            <CreditCard className="mr-2 h-4 w-4" /> Billing
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-orange-600 hover:bg-orange-50">
                            <CircleHelp className="mr-2 h-4 w-4" /> Help Center
                        </Button>
                    </div>

                    {/* Settings Content */}
                    <div className="space-y-6">
                        {/* Shop Preferences Section */}
                        <Card className="border-none shadow-sm shadow-orange-100/50 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-orange-600 mb-1">
                                    <Store size={18} className="font-bold" />
                                    <CardTitle className="text-lg">Shop Preferences</CardTitle>
                                </div>
                                <CardDescription>Configure how your shop appears to customers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold text-gray-700">Accepting Orders</Label>
                                            <p className="text-xs text-muted-foreground">Temporarily stop accepting new orders.</p>
                                        </div>
                                        <Switch 
                                            checked={settings.is_accepting_orders} 
                                            onCheckedChange={(val) => setSettings({...settings, is_accepting_orders: val})} 
                                        />
                                    </div>
                                    <Separator className="bg-gray-100" />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold text-gray-700">Auto-Approve Orders</Label>
                                            <p className="text-xs text-muted-foreground">Orders will be marked as processing immediately.</p>
                                        </div>
                                        <Switch 
                                            checked={settings.auto_approve_orders} 
                                            onCheckedChange={(val) => setSettings({...settings, auto_approve_orders: val})} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2 pt-2">
                                    <Label className="text-sm font-bold text-gray-700 text-muted-foreground">Order Notification Email</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={settings.notification_email} 
                                            onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                                            className="bg-white border-gray-100" 
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications Section */}
                        <Card className="border-none shadow-sm shadow-orange-100/50 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-orange-600 mb-1">
                                    <Bell size={18} className="font-bold" />
                                    <CardTitle className="text-lg">Notifications</CardTitle>
                                </div>
                                <CardDescription>Manage how you want to be alerted.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-gray-600">Low Stock Warnings</Label>
                                    <Switch 
                                        checked={settings.is_low_stock_alert_enabled} 
                                        onCheckedChange={(val) => setSettings({...settings, is_low_stock_alert_enabled: val})} 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Section Area */}
                        <Card className="border-none shadow-sm shadow-orange-100/50 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-orange-600 mb-1">
                                    <Lock size={18} className="font-bold" />
                                    <CardTitle className="text-lg">Security</CardTitle>
                                </div>
                                <CardDescription>Keep your account safe and secure.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="text-orange-600" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Two-Factor Authentication</p>
                                            <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" disabled>Enable</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
