import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, FileText, Loader2, RefreshCcw } from "lucide-react";
import { fetchPendingPandits, verifyPandit, rejectPandit, type Pandit } from "@/lib/api";

export default function AdminPandits() {
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedPandit, setSelectedPandit] = useState<Pandit | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const { toast } = useToast();

    const loadPandits = async () => {
        setLoading(true);
        try {
            const data = await fetchPendingPandits();
            setPandits(data);
        } catch (error) {
            console.error("Failed to load pending pandits", error);
            toast({
                title: "Error",
                description: "Failed to load pending pandits",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPandits();
    }, []);

    const handleApprove = async (pandit: Pandit) => {
        if (!confirm(`Are you sure you want to approve ${pandit.user_details.full_name}?`)) return;

        try {
            await verifyPandit(pandit.id);
            toast({
                title: "Pandit Approved",
                description: `${pandit.user_details.full_name} has been verified successfully.`,
            });
            loadPandits();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to approve pandit",
                variant: "destructive",
            });
        }
    };

    const openRejectDialog = (pandit: Pandit) => {
        setSelectedPandit(pandit);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleReject = async () => {
        if (!selectedPandit) return;
        if (!rejectReason) {
            toast({
                title: "Reason required",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            });
            return;
        }

        try {
            await rejectPandit(selectedPandit.id, rejectReason);
            toast({
                title: "Pandit Rejected",
                description: `${selectedPandit.user_details.full_name} has been rejected.`,
            });
            setRejectDialogOpen(false);
            loadPandits();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject pandit",
                variant: "destructive",
            });
        }
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Pandit Verification</h1>
                    <Button variant="outline" onClick={loadPandits}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Verifications ({pandits.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pandit Name</TableHead>
                                        <TableHead>Experience</TableHead>
                                        <TableHead>Language</TableHead>
                                        <TableHead>Certificate</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-6 w-6 animate-spin inline" />
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : pandits.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No pending verifications found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pandits.map((pandit) => (
                                            <TableRow key={pandit.id}>
                                                <TableCell className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={pandit.user_details.profile_pic_url || ""} />
                                                        <AvatarFallback>{pandit.user_details.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{pandit.user_details.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">{pandit.user_details.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{pandit.experience_years} Years</TableCell>
                                                <TableCell>{pandit.language}</TableCell>
                                                <TableCell>
                                                    {pandit.certification_file ? (
                                                        <a
                                                            href={pandit.certification_file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-blue-600 hover:underline"
                                                        >
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Not uploaded</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                        {pandit.verification_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleApprove(pandit)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => openRejectDialog(pandit)}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Application</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting the verification request for{' '}
                                <span className="font-semibold">{selectedPandit?.user_details.full_name}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReject}>
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
