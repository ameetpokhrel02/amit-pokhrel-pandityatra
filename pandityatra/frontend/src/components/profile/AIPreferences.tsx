import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { recommenderApi } from '@/api/recommender';
import { Loader2, Bot, Heart, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AIPreferences = () => {
    const [preferences, setPreferences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const data = await recommenderApi.getUserPreferences();
            setPreferences(data.results || data);
        } catch (err) {
            console.error("Failed to load user preferences", err);
            toast({
                title: "Error",
                description: "Failed to load AI Samagri Preferences.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePreference = async (pref: any, key: 'is_favorite' | 'never_recommend') => {
        setSaving(pref.id);
        try {
            const newValue = !pref[key];
            const payload = {
                is_favorite: key === 'is_favorite' ? newValue : pref.is_favorite,
                never_recommend: key === 'never_recommend' ? newValue : pref.never_recommend
            };
            
            // Mutual exclusivity logic
            if (key === 'is_favorite' && newValue) payload.never_recommend = false;
            if (key === 'never_recommend' && newValue) payload.is_favorite = false;

            await recommenderApi.updatePreference(pref.samagri_item.id, payload);
            
            setPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, ...payload } : p));
            toast({
                title: "Preference Updated",
                description: "We've adjusted your AI recommendations.",
            });
        } catch (err) {
            console.error("Failed to update preference", err);
            toast({
                title: "Update Failed",
                description: "There was an issue saving your preference.",
                variant: "destructive"
            });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (preferences.length === 0) {
        return (
            <div className="text-center p-8 bg-orange-50/50 rounded-xl border border-orange-100">
                <Bot className="w-12 h-12 text-orange-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-orange-900">No Learning History Yet</h3>
                <p className="text-orange-800/70 text-sm mt-1">Our AI learns your preferences as you book more pujas. Check back here to manage what we suggest to you!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 text-sm text-orange-800">
                <p>The AI algorithm learns from your purchase history. Use these toggles to force the AI to always include or explicitly ignore specific samagri items in future booking suggestions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {preferences.map((pref) => (
                    <Card key={pref.id} className="border-orange-100 shadow-sm relative overflow-hidden">
                        {saving === pref.id && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">{pref.samagri_item.name || 'Sacred Item'}</CardTitle>
                            <CardDescription className="text-xs">
                                Purchased {pref.times_purchased} times
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Heart className={`w-4 h-4 ${pref.is_favorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                                    <span className="text-sm font-medium">Always Recommend</span>
                                </div>
                                <Switch
                                    checked={pref.is_favorite}
                                    onCheckedChange={() => handleTogglePreference(pref, 'is_favorite')}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ban className={`w-4 h-4 ${pref.never_recommend ? 'text-gray-900' : 'text-gray-400'}`} />
                                    <span className="text-sm font-medium">Never Suggest</span>
                                </div>
                                <Switch
                                    checked={pref.never_recommend}
                                    onCheckedChange={() => handleTogglePreference(pref, 'never_recommend')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
