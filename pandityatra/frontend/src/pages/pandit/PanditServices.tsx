import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, IndianRupee } from "lucide-react";
import apiClient from "@/lib/api-client";

interface PanditService {
    id: number;
    puja_details: {
        id: number;
        name: string;
        description: string;
        base_price: string;
        base_duration_minutes: number;
    };
    custom_price: string;
    duration_minutes: number;
    is_active: boolean;
    is_online: boolean;
    is_offline: boolean;
}

interface Puja {
    id: number;
    name: string;
    description: string;
    base_price: string;
    base_duration_minutes: number;
}

export default function PanditServices() {
    const { toast } = useToast();
    const [services, setServices] = useState<PanditService[]>([]);
    const [availablePujas, setAvailablePujas] = useState<Puja[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    // Form State
    const [selectedPujaId, setSelectedPujaId] = useState<string>("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [isOnline, setIsOnline] = useState(false);
    const [isOffline, setIsOffline] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, catalogRes] = await Promise.all([
                apiClient.get("/pandits/my-services/"),
                apiClient.get("/pandits/services/catalog/")
            ]);
            setServices(servicesRes.data);
            setAvailablePujas(catalogRes.data);
        } catch (error) {
            console.error("Error fetching services", error);
            toast({
                title: "Error",
                description: "Failed to load services",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!selectedPujaId || !price || !duration) {
            toast({ title: "Error", description: "All fields are required", variant: "destructive" });
            return;
        }

        try {
            await apiClient.post("/pandits/my-services/", {
                puja_id: selectedPujaId,
                custom_price: price,
                duration_minutes: duration,
                is_online: isOnline,
                is_offline: isOffline,
                is_active: true
            });
            
            toast({ title: "Success", description: "Service added successfully" });
            setIsAddOpen(false);
            fetchData(); // Refresh
            
            // Reset form
            setSelectedPujaId("");
            setPrice("");
            setDuration("");
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.detail || "Failed to add service", 
                variant: "destructive" 
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to remove this service?")) return;
        try {
            await apiClient.delete(`/pandits/my-services/${id}/`);
            toast({ title: "Success", description: "Service removed" });
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove service", variant: "destructive" });
        }
    };

    // Helper to auto-fill defaults when puja selected
    const onPujaSelect = (val: string) => {
        setSelectedPujaId(val);
        const puja = availablePujas.find(p => p.id.toString() === val);
        if (puja) {
            setPrice(puja.base_price);
            setDuration(puja.base_duration_minutes.toString());
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <DashboardLayout userRole="pandit">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
                        <p className="text-muted-foreground">Manage the Pujas you offer and your pricing.</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Service</DialogTitle>
                                <DialogDescription>Select a Puja from the catalog to offer.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Puja Type</Label>
                                    <Select value={selectedPujaId} onValueChange={onPujaSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Puja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePujas.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.name} (Base: ₹{p.base_price})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Your Price (₹)</Label>
                                        <Input 
                                            type="number" 
                                            value={price} 
                                            onChange={e => setPrice(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration (Minutes)</Label>
                                        <Input 
                                            type="number" 
                                            value={duration} 
                                            onChange={e => setDuration(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={isOnline} onCheckedChange={setIsOnline} id="online-mode"/>
                                        <Label htmlFor="online-mode">Online</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={isOffline} onCheckedChange={setIsOffline} id="offline-mode"/>
                                        <Label htmlFor="offline-mode">In-Person</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddService}>Save Service</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Active Services ({services.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Modes</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No services added yet. Click "Add Service" to start earning.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    services.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">
                                                {service.puja_details.name}
                                                <div className="text-xs text-muted-foreground line-clamp-1">{service.puja_details.description}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <IndianRupee className="h-3 w-3 mr-1" />
                                                    {service.custom_price}
                                                </div>
                                            </TableCell>
                                            <TableCell>{service.duration_minutes} mins</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {service.is_online && <Badge variant="secondary">Online</Badge>}
                                                    {service.is_offline && <Badge variant="default">In-Person</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={service.is_active ? "outline" : "destructive"}>
                                                    {service.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
