import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Upload, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import apiClient from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
    { value: 'UI', label: 'User Interface' },
    { value: 'FUNCTIONAL', label: 'Functional Bug' },
    { value: 'PERFORMANCE', label: 'Performance' },
    { value: 'SECURITY', label: 'Security' },
    { value: 'TEXT_ISSUE', label: 'Text/Content Issue' },
    { value: 'INTEGRATION', label: 'Integration' },
    { value: 'OTHER', label: 'Other' },
];

const SEVERITIES = [
    { value: 'LOW', label: 'Low', color: 'text-blue-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
    { value: 'HIGH', label: 'High', color: 'text-orange-500' },
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-500' },
];

const ReportBug = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'OTHER',
        severity: 'MEDIUM',
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast({
                title: "Required Fields Missing",
                description: "Please provide a title and description for the bug.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('severity', formData.severity);
            if (file) {
                data.append('attachment', file);
            }

            await apiClient.post('/bug-reports/reports/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSubmitted(true);
            toast({
                title: "Bug Reported Successfully",
                description: "Thank you for your feedback. Our team will look into it.",
            });
        } catch (error: any) {
            console.error("Error reporting bug:", error);
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <DashboardLayout userRole={user?.role as any}>
                <div className="max-w-2xl mx-auto py-12 px-4 h-[70vh] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-orange-100 dark:border-orange-900/30"
                    >
                        <div className="flex justify-center mx-auto mb-2">
                            <img
                                src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775122347/errro_p4ej8m.png"
                                alt="Bug Reported"
                                className="w-40 md:w-48 h-auto object-contain mix-blend-multiply dark:mix-blend-normal"
                            />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-playfair text-orange-600">Report Submitted!</h2>
                        <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
                            Thank you for your report! Our system has successfully received it. The PanditYatra engineering team will investigate this immediately.
                        </p>
                        <div className="pt-4">
                            <Button
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({ title: '', description: '', category: 'OTHER', severity: 'MEDIUM' });
                                    setFile(null);
                                    setPreview(null);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 h-12 px-8 rounded-full text-lg shadow-lg hover:shadow-orange-500/30 transition-all font-semibold"
                            >
                                Report Another Issue
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole={user?.role as any}>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                            <ShieldAlert className="h-8 w-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Bug Report Center</h1>
                            <p className="text-muted-foreground">Help us build a better PanditYatra experience.</p>
                        </div>
                    </div>

                    <Card className="border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 p-10 border-b border-orange-100/20">
                            <CardTitle className="text-2xl font-extrabold flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-orange-500" />
                                Incident Details
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Provide as much detail as possible to help our engineering team reproduce and fix the issue.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                {/* Row 1: Full-width Title */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">
                                        Issue Title
                                    </label>
                                    <Input
                                        placeholder="Briefly describe the problem (e.g. Dashboard stats not refreshing)"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-14 rounded-2xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/10 text-lg transition-all"
                                    />
                                </div>

                                {/* Row 2: Two Columns for Cat/Sev vs Description */}
                                <div className="grid gap-10 md:grid-cols-5">
                                    {/* Left Column (Cat/Sev) */}
                                    <div className="md:col-span-2 space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">
                                                Category
                                            </label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(v) => setFormData({ ...formData, category: v })}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl border-gray-200 text-lg">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl shadow-2xl">
                                                    {CATEGORIES.map(cat => (
                                                        <SelectItem key={cat.value} value={cat.value} className="py-3 rounded-xl">{cat.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">
                                                Severity
                                            </label>
                                            <Select
                                                value={formData.severity}
                                                onValueChange={(v) => setFormData({ ...formData, severity: v })}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl border-gray-200 text-lg">
                                                    <SelectValue placeholder="Select Severity" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl shadow-2xl">
                                                    {SEVERITIES.map(sev => (
                                                        <SelectItem key={sev.value} value={sev.value} className="py-3 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${sev.value === 'CRITICAL' ? 'bg-red-500 animate-pulse' : sev.value === 'HIGH' ? 'bg-orange-500' : sev.value === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                                                <span className={sev.color}>{sev.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Right Column (Description) */}
                                    <div className="md:col-span-3 space-y-3">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">
                                            Detailed Description
                                        </label>
                                        <Textarea
                                            placeholder="What happened? What did you expect to happen? How can we reproduce it?"
                                            className="h-full min-h-[220px] rounded-[2rem] border-gray-200 p-6 text-lg leading-relaxed focus:border-orange-500 focus:ring-orange-500/10 transition-all resize-none"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Attachments */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider flex items-center gap-2">
                                        Attachments <span className="text-[10px] font-normal bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                                    </label>
                                    <div className="group relative">
                                        <div className={`
                                            border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center transition-all duration-500
                                            ${preview || file ? 'border-orange-500/40 bg-orange-50/20' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/5'}
                                        `}>
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                                accept="image/*,.pdf"
                                            />
                                            {preview ? (
                                                <div className="relative group/preview w-full max-w-[400px] aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800">
                                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-center opacity-0 group-hover/preview:opacity-100 transition-all">
                                                        <p className="text-white text-sm font-bold tracking-widest uppercase">Select Different File</p>
                                                    </div>
                                                </div>
                                            ) : file ? (
                                                <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-orange-100">
                                                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/40 rounded-[2rem] flex items-center justify-center mx-auto mb-4 scale-110">
                                                        <Upload className="h-10 w-10 text-orange-600" />
                                                    </div>
                                                    <p className="font-bold text-xl text-gray-800 dark:text-gray-200 truncate max-w-[250px] mx-auto">{file.name}</p>
                                                    <p className="text-xs text-orange-500 mt-2 font-black uppercase tracking-widest">Document Selected</p>
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-4">
                                                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-orange-100/50">
                                                        <Upload className="h-12 w-12 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-gray-700 dark:text-gray-300">Drop files here</p>
                                                        <p className="text-gray-400 mt-2 font-medium">Or click to browse your computer</p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-3 pt-2">
                                                        <Badge variant="outline" className="text-[10px] font-bold py-1 bg-white">PNG</Badge>
                                                        <Badge variant="outline" className="text-[10px] font-bold py-1 bg-white">JPG</Badge>
                                                        <Badge variant="outline" className="text-[10px] font-bold py-1 bg-white">PDF</Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button Section */}
                                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-orange-100/20">
                                    <div className="flex items-center gap-3 text-muted-foreground bg-gray-50 dark:bg-gray-800/50 px-6 py-3 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-sm font-medium">Securely connected to Bug Center</span>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="h-16 px-16 bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-black text-xl shadow-[0_20px_40px_-5px_rgba(249,115,22,0.3)] hover:shadow-orange-500/40 transform active:scale-95 transition-all min-w-[280px]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                                Transmitting...
                                            </>
                                        ) : (
                                            "Submit Bug Report"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default ReportBug;
