import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, Loader2, DollarSign, Wallet } from "lucide-react";
import apiClient from "@/lib/api-client";

// 🚨 UPDATED INTERFACE to match payments/views.py
interface PanditEarning {
    pandit_id: number;
    pandit_name: string;
    email: string;
    total_earned: string;
    available: string;
    withdrawn: string;
    pending_withdrawals: number;
}

interface WithdrawalRequest {
    id: number;
    pandit_name: string;
    amount: string;
    status: string;
    date: string; // Changed from created_at
}

export default function AdminPayouts() {
    const [earnings, setEarnings] = useState<PanditEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            // 🚨 UPDATED ENDPOINTS
            const [earningRes, withdrawalRes] = await Promise.all([
                apiClient.get("/payments/admin/payouts/"),
                apiClient.get("/payments/admin/withdrawals/")
            ]);
            setEarnings(earningRes.data);
            setWithdrawals(withdrawalRes.data);
        } catch (error) {
            console.error("Failed to load payout data", error);
            toast({
                title: "Error",
                description: "Failed to load payout data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprovePayout = async (id: number) => {
        if (!confirm("Approve this payout request? Money will be deducted from balance.")) return;
         try {
            // 🚨 UPDATED ENDPOINT
            await apiClient.post(`/payments/admin/withdrawals/${id}/approve/`);
            toast({
                title: "Payout Approved",
                description: "Withdrawal request has been processed.",
            });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to approve payout",
                variant: "destructive",
            });
        }
    };


    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pandit Payouts</h1>
                        <p className="text-muted-foreground">Manage withdrawals and view pandit earnings.</p>
                    </div>
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Withdrawal Requests */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Withdrawal Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pandit</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.filter(w => w.status === 'PENDING').length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                No pending requests.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        withdrawals.filter(w => w.status === 'PENDING').map((w) => (
                                            <TableRow key={w.id}>
                                                <TableCell className="font-medium">{w.pandit_name}</TableCell>
                                                <TableCell>Rs. {w.amount}</TableCell>
                                                <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleApprovePayout(w.id)}>PAY</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Earnings Overview */}
                    <Card className="col-span-1">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Pandit Earnings Ledger
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pandit</TableHead>
                                            <TableHead>Total Earned</TableHead>
                                            <TableHead>Available</TableHead>
                                            <TableHead>Withdrawn</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                            </TableRow>
                                        ) : earnings.map((p) => (
                                            <TableRow key={p.pandit_id}>
                                                <TableCell>
                                                    <div className="font-medium">{p.pandit_name}</div>
                                                    <div className="text-xs text-muted-foreground">{p.email}</div>
                                                </TableCell>
                                                <TableCell className="text-green-600">Rs. {p.total_earned}</TableCell>
                                                <TableCell className="font-bold">Rs. {p.available}</TableCell>
                                                <TableCell className="text-muted-foreground">Rs. {p.withdrawn}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
