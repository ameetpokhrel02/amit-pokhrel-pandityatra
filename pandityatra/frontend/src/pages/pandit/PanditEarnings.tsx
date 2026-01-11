import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingUp, History, ArrowDownToLine } from "lucide-react";
import apiClient from "@/lib/api-client";
import { format } from "date-fns";

interface WalletStats {
    total_earned: string;
    available_balance: string;
    total_withdrawn: string;
}

interface Withdrawal {
    id: number;
    amount: string;
    status: string;
    created_at: string;
}

export default function PanditEarnings() {
    const [wallet, setWallet] = useState<WalletStats>({
        total_earned: "0.00",
        available_balance: "0.00",
        total_withdrawn: "0.00"
    });
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestAmount, setRequestAmount] = useState("");
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const { toast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const [walletRes, historyRes] = await Promise.all([
                apiClient.get("/pandits/wallet/"),
                apiClient.get("/pandits/withdrawals/")
            ]);
            setWallet(walletRes.data);
            setWithdrawals(historyRes.data);
        } catch (error) {
            console.error("Failed to load earnings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleWithdraw = async () => {
        const amount = parseFloat(requestAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid positive number.", variant: "destructive" });
            return;
        }
        if (amount > parseFloat(wallet.available_balance)) {
            toast({ title: "Insufficient Funds", description: "You cannot withdraw more than your available balance.", variant: "destructive" });
            return;
        }

        try {
            await apiClient.post("/pandits/withdrawal/request/", { amount: amount });
            toast({ title: "Request Sent", description: "Your withdrawal request has been sent to admin for approval." });
            setIsWithdrawOpen(false);
            setRequestAmount("");
            loadData(); // Refresh data
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.error || "Failed to submit request", 
                variant: "destructive" 
            });
        }
    };

    return (
        <DashboardLayout userRole="pandit">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
                        <p className="text-muted-foreground">Track your income and request payouts.</p>
                    </div>
                    
                    <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <ArrowDownToLine className="h-4 w-4" /> Withdraw Funds
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Request Withdrawal</DialogTitle>
                                <DialogDescription>
                                    Enter the amount you wish to withdraw. Minimum Rs. 500.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Available Balance</div>
                                    <div className="text-2xl font-bold text-green-600">Rs. {wallet.available_balance}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Withdrawal Amount (Rs.)</label>
                                    <Input 
                                        type="number" 
                                        placeholder="Enter amount" 
                                        value={requestAmount}
                                        onChange={(e) => setRequestAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
                                <Button onClick={handleWithdraw}>Submit Request</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rs. {wallet.total_earned}</div>
                            <p className="text-xs text-muted-foreground">Lifetime earnings from bookings</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">Rs. {wallet.available_balance}</div>
                            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
                            <History className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rs. {wallet.total_withdrawn}</div>
                            <p className="text-xs text-muted-foreground">Total payout processed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Transaction ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No withdrawal requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    withdrawals.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell>{format(new Date(w.created_at), "MMM dd, yyyy")}</TableCell>
                                            <TableCell className="font-medium">Rs. {w.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    w.status === "APPROVED" ? "default" : 
                                                    w.status === "REJECTED" ? "destructive" : "secondary"
                                                }>
                                                    {w.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">#{w.id}</TableCell>
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
