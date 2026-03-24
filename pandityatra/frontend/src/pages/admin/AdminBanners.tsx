import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Upload,
    ExternalLink,
    Clock,
    Eye,
    MousePointerClick,
    Image as ImageIcon,
    Layout,
    Calendar as CalendarIcon,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    type Banner
} from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import PANDIT_LOGO from "@/assets/images/PanditYatralogo.png";

// Cloudinary constants - using data from .env
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dm0vvpzs9";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "products";

export default function AdminBanners() {
    const { role } = useAuth();
    // Debug logging for Cloudinary - printing directly as strings
    console.log("Cloudinary Cloud Name:", CLOUDINARY_CLOUD_NAME);
    console.log("Cloudinary Upload Preset:", CLOUDINARY_UPLOAD_PRESET);
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Partial<Banner> | null>(null);
    const [uploading, setUploading] = useState({ desktop: false, mobile: false });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [bannerIdToDelete, setBannerIdToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        try {
            const data = await fetchBanners();
            setBanners(data);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to load banners",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async (file: File, type: 'desktop' | 'mobile') => {
        toast({
            title: "Uploading Image",
            description: `Please wait while ${type} image is uploading to Cloudinary...`,
        });

        setUploading(prev => ({ ...prev, [type]: true }));
        const formData = new FormData();
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('file', file);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
                { method: 'POST', body: formData }
            );
            
            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || "Upload failed";
                throw new Error(errorMsg);
            }

            if (data.secure_url) {
                setCurrentBanner(prev => ({
                    ...prev,
                    [type === 'desktop' ? 'image_url' : 'mobile_image_url']: data.secure_url
                }));
                toast({
                    title: "Upload Success",
                    description: `${type} image uploaded successfully!`,
                });
            } else {
                throw new Error("Upload failed: No secure URL returned");
            }
        } catch (err: any) {
            console.error("Upload Error Details:", err);
            toast({
                title: "Upload Error",
                description: err.message || `Failed to upload ${type} image.`,
                variant: "destructive"
            });
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBanner?.image_url) {
            toast({
                title: "Error",
                description: "Desktop image is required",
                variant: "destructive"
            });
            return;
        }

        try {
            // Fix: Send null instead of empty string for optional fields
            const payload = {
                ...currentBanner,
                link_url: currentBanner.link_url || null,
                link_text: currentBanner.link_text || null,
                start_date: currentBanner.start_date || null,
                end_date: currentBanner.end_date || null,
                mobile_image_url: currentBanner.mobile_image_url || null,
                background_color: currentBanner.background_color || null,
                text_color: currentBanner.text_color || null,
            };

            if (currentBanner.id) {
                const updated = await updateBanner(currentBanner.id, payload);
                setBanners(prev => prev.map(b => b.id === currentBanner.id ? updated : b));
                toast({ title: "Success", description: "Banner updated successfully" });
            } else {
                const newBanner = await createBanner(payload);
                setBanners(prev => [newBanner, ...prev]);
                toast({ title: "Success", description: "Banner created successfully" });
            }
            setIsEditing(false);
            setCurrentBanner(null);
        } catch (err: any) {
            console.error("Save error:", err.response?.data || err.message);
            toast({
                title: "Error",
                description: err.response?.data?.detail || "Failed to save banner. Please check all required fields.",
                variant: "destructive"
            });
        }
    };

     const handleDelete = async () => {
        if (!bannerIdToDelete) return;
        
        try {
            await deleteBanner(bannerIdToDelete);
            setBanners(prev => prev.filter(b => b.id !== bannerIdToDelete));
            toast({ title: "Success", description: "Banner deleted successfully" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete banner", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setBannerIdToDelete(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-green-500">Active</Badge>;
            case 'INACTIVE': return <Badge variant="secondary">Inactive</Badge>;
            case 'SCHEDULED': return <Badge className="bg-blue-500">Scheduled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (loading && banners.length === 0) {
        return (
            <DashboardLayout userRole="admin">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole="admin">
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
                        <p className="text-gray-500 mt-1">Manage hero section banners for flash sales and festivals</p>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => {
                            setIsEditing(true);
                            setCurrentBanner({
                                banner_type: 'MAIN_BANNER',
                                status: 'ACTIVE',
                                priority_order: 1
                            });
                        }} className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Banner
                        </Button>
                    )}
                </div>

                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="border-orange-100 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>{currentBanner?.id ? 'Edit Banner' : 'Create New Banner'}</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSave} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column: Basic Info */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Banner Title</Label>
                                                    <Input
                                                        id="title"
                                                        value={currentBanner?.title || ''}
                                                        onChange={e => setCurrentBanner(prev => ({ ...prev, title: e.target.value }))}
                                                        placeholder="e.g., Diwali Special Sale"
                                                        required
                                                        className="border-orange-100 focus:ring-orange-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Description (Optional)</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={currentBanner?.description || ''}
                                                        onChange={e => setCurrentBanner(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Banner subtile / description text"
                                                        rows={3}
                                                        className="border-orange-100 focus:ring-orange-500"
                                                    />
                                                </div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Banner Type</Label>
                                                        <Select
                                                            value={currentBanner?.banner_type}
                                                            onValueChange={(val: any) => setCurrentBanner(prev => ({ ...prev, banner_type: val }))}
                                                        >
                                                            <SelectTrigger className="border-orange-100 focus:ring-orange-500">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="MAIN_BANNER">Main Banner</SelectItem>
                                                                <SelectItem value="SALE_BANNER">Sale Banner</SelectItem>
                                                                <SelectItem value="FESTIVAL_BANNER">Festival Banner</SelectItem>
                                                                <SelectItem value="OFFER_BANNER">Offer Banner</SelectItem>
                                                                <SelectItem value="DISCOUNT_BANNER">Discount Banner</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Status</Label>
                                                        <Select
                                                            value={currentBanner?.status}
                                                            onValueChange={(val: any) => setCurrentBanner(prev => ({ ...prev, status: val }))}
                                                        >
                                                            <SelectTrigger className="border-orange-100 focus:ring-orange-500">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Priority</Label>
                                                        <Input
                                                            type="number"
                                                            value={currentBanner?.priority_order || 1}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, priority_order: parseInt(e.target.value) }))}
                                                            className="border-orange-100 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Start Date (Optional)</Label>
                                                        <Input
                                                            type="datetime-local"
                                                            className="w-full border-orange-100 focus:ring-orange-500"
                                                            value={currentBanner?.start_date ? new Date(currentBanner.start_date).toISOString().slice(0, 16) : ''}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, start_date: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="link_url">Link URL (Optional)</Label>
                                                        <Input
                                                            id="link_url"
                                                            value={currentBanner?.link_url || ''}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, link_url: e.target.value }))}
                                                            placeholder="/shop/samagri"
                                                            className="bg-orange-50/30 border-orange-100 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="link_text">Button Text (Optional)</Label>
                                                        <Input
                                                            id="link_text"
                                                            value={currentBanner?.link_text || ''}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, link_text: e.target.value }))}
                                                            placeholder="Shop Now"
                                                            className="bg-orange-50/30 border-orange-100 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>End Date (Optional)</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        className="w-full border-orange-100 focus:ring-orange-500"
                                                        value={currentBanner?.end_date ? new Date(currentBanner.end_date).toISOString().slice(0, 16) : ''}
                                                        onChange={e => setCurrentBanner(prev => ({ ...prev, end_date: e.target.value }))}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column: Images */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Desktop Banner Image (1200x400)</Label>
                                                    <div className="flex items-center gap-4">
                                                        {currentBanner?.image_url ? (
                                                            <div className="relative group w-40 h-20 rounded-lg overflow-hidden border">
                                                                <img src={currentBanner.image_url} alt="Desktop" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <label className="cursor-pointer p-2 bg-white rounded-full">
                                                                        <Upload className="h-4 w-4 text-orange-600" />
                                                                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'desktop')} />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-40 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400">
                                                                <ImageIcon className="h-6 w-6" />
                                                                <span className="text-xs">No image</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'desktop')}
                                                                disabled={uploading.desktop}
                                                                className="border-orange-100 focus:ring-orange-500"
                                                            />
                                                            <p className="text-[10px] text-gray-500 mt-1">Recommended size: 1200 x 400 px</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Mobile Banner Image (optional, 400x600)</Label>
                                                    <div className="flex items-center gap-4">
                                                        {currentBanner?.mobile_image_url ? (
                                                            <div className="relative group w-20 h-24 rounded-lg overflow-hidden border">
                                                                <img src={currentBanner.mobile_image_url} alt="Mobile" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <label className="cursor-pointer p-2 bg-white rounded-full">
                                                                        <Upload className="h-4 w-4 text-orange-600" />
                                                                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'mobile')} />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400">
                                                                <ImageIcon className="h-6 w-6" />
                                                                <span className="text-xs">Optional</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'mobile')}
                                                                disabled={uploading.mobile}
                                                                className="border-orange-100 focus:ring-orange-500"
                                                            />
                                                            <p className="text-[10px] text-gray-500 mt-1">Special portrait image for mobile devices</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Background Color (CSS) (Optional)</Label>
                                                        <Input
                                                            value={currentBanner?.background_color || ''}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, background_color: e.target.value }))}
                                                            placeholder="#ffffff"
                                                            className="border-orange-100 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Text Color (CSS) (Optional)</Label>
                                                        <Input
                                                            value={currentBanner?.text_color || ''}
                                                            onChange={e => setCurrentBanner(prev => ({ ...prev, text_color: e.target.value }))}
                                                            placeholder="#000000"
                                                            className="border-orange-100 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                            <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                                            <Button type="submit" disabled={uploading.desktop || uploading.mobile} className="bg-orange-500 hover:bg-orange-600">
                                                <Save className="h-4 w-4 mr-2" />
                                                {currentBanner?.id ? 'Update Banner' : 'Create Banner'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Banner List Table */}
                <Card className="mt-8 border-none shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Banner Details</TableHead>
                                <TableHead>Type & Status</TableHead>
                                <TableHead>Metrics</TableHead>
                                <TableHead>Uploader</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        No banners found. Click "Add New Banner" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners.map((banner) => (
                                    <TableRow key={banner.id} className="group hover:bg-gray-50/50">
                                        <TableCell>
                                            <div className="relative h-12 w-24 rounded overflow-hidden border bg-gray-100">
                                                <img 
                                                    src={banner.image_url} 
                                                    alt={banner.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{banner.title}</span>
                                                <span className="text-xs text-gray-500 line-clamp-1">{banner.description || 'No description'}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 bg-orange-50 text-orange-600 border-orange-100">
                                                        #{banner.priority_order}
                                                    </Badge>
                                                    {banner.start_date && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            Starts: {new Date(banner.start_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(banner.status)}
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                                    {banner.banner_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase">Views</span>
                                                    <span className="text-sm font-medium">{banner.view_count}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase">CTR</span>
                                                    <span className="text-sm font-medium text-orange-600">
                                                        {banner.view_count > 0 ? ((banner.click_count / banner.view_count) * 100).toFixed(1) : '0'}%
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-gray-900 leading-none">
                                                        {banner.created_by?.full_name || 'System'}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] p-0 h-auto font-bold uppercase text-gray-400 tracking-tighter">
                                                        {banner.created_by?.role || 'Admin'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                                                    onClick={() => {
                                                        setCurrentBanner(banner);
                                                        setIsEditing(true);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        if (banner.id) {
                                                            setBannerIdToDelete(banner.id);
                                                            setIsDeleteDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
 
                {banners.length === 0 && !isEditing && (
                    <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No banners found</h3>
                        <p className="text-gray-500 mt-1 mb-6">Create your first banner for sales and festivals</p>
                        <Button onClick={() => {
                            setIsEditing(true);
                            setCurrentBanner({ banner_type: 'MAIN_BANNER', status: 'ACTIVE', priority_order: 1 });
                        }} className="bg-orange-500">
                            Add New Banner
                        </Button>
                    </div>
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="max-w-[400px]">
                        <AlertDialogHeader>
                            <div className="flex flex-col items-center gap-4 mb-2">
                                <div className="p-3 rounded-full bg-orange-50">
                                    <img src={PANDIT_LOGO} alt="PanditYatra Logo" className="h-12 w-auto" />
                                </div>
                                <AlertDialogTitle className="text-center text-xl font-bold text-gray-900">
                                    Confirm Deletion
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-center text-gray-600">
                                    Are you sure you want to delete this banner? This action cannot be undone.
                                </AlertDialogDescription>
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="sm:justify-center gap-3">
                            <AlertDialogCancel className="w-full sm:w-auto border-gray-200">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                            >
                                Delete Banner
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

