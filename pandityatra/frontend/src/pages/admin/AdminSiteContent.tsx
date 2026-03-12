import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { fetchAdminSiteContent, updateSiteContent, type SiteContentItem } from '@/lib/api';
import { FileText, Save, CheckCircle, AlertCircle, RefreshCw, Type, Phone, Mail, MapPin, Megaphone, Footprints } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON_MAP: Record<string, any> = {
    hero_title: Type,
    hero_subtitle: Type,
    about_title: Type,
    about_text: FileText,
    contact_address: MapPin,
    contact_phone: Phone,
    contact_email: Mail,
    announcement: Megaphone,
    footer_text: Footprints,
};

export default function AdminSiteContent() {
    const { role } = useAuth();
    const [contents, setContents] = useState<SiteContentItem[]>([]);
    const [availableKeys, setAvailableKeys] = useState<{ key: string; label: string }[]>([]);
    const [existingKeys, setExistingKeys] = useState<string[]>([]);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminSiteContent();
            setContents(data.contents);
            setAvailableKeys(data.available_keys);
            setExistingKeys(data.existing_keys);

            // Initialize edit values from existing content
            const values: Record<string, string> = {};
            data.contents.forEach(c => {
                values[c.key] = c.value;
            });
            // Also initialize empty values for missing keys
            data.available_keys.forEach(k => {
                if (!values[k.key]) values[k.key] = '';
            });
            setEditValues(values);
        } catch (err) {
            console.error('Failed to load site content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const items = Object.entries(editValues).map(([key, value]) => ({ key, value }));
            await updateSiteContent(items);
            setMessage({ type: 'success', text: 'All content saved successfully!' });
            loadContent(); // Refresh
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save content' });
        } finally {
            setSaving(false);
        }
    };

    const isLongField = (key: string) => ['about_text', 'announcement', 'footer_text', 'hero_subtitle'].includes(key);

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
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Site Content</h1>
                        <p className="text-gray-500 mt-1">Edit your website's public-facing text and information</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadContent} disabled={loading}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={handleSaveAll} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </Button>
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

                {/* Content Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableKeys.map((keyInfo, idx) => {
                        const IconComponent = ICON_MAP[keyInfo.key] || FileText;
                        const existing = contents.find(c => c.key === keyInfo.key);

                        return (
                            <motion.div
                                key={keyInfo.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={isLongField(keyInfo.key) ? 'md:col-span-2' : ''}
                            >
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <IconComponent className="h-4 w-4 text-orange-500" />
                                            {keyInfo.label}
                                        </CardTitle>
                                        {existing && (
                                            <CardDescription className="text-xs">
                                                Last updated: {new Date(existing.updated_at).toLocaleDateString()}
                                                {existing.updated_by_name && ` by ${existing.updated_by_name}`}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {isLongField(keyInfo.key) ? (
                                            <Textarea
                                                value={editValues[keyInfo.key] || ''}
                                                onChange={e => setEditValues(prev => ({
                                                    ...prev,
                                                    [keyInfo.key]: e.target.value
                                                }))}
                                                placeholder={`Enter ${keyInfo.label.toLowerCase()}...`}
                                                rows={4}
                                                className="resize-y"
                                            />
                                        ) : (
                                            <Input
                                                value={editValues[keyInfo.key] || ''}
                                                onChange={e => setEditValues(prev => ({
                                                    ...prev,
                                                    [keyInfo.key]: e.target.value
                                                }))}
                                                placeholder={`Enter ${keyInfo.label.toLowerCase()}...`}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveAll} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving All...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
