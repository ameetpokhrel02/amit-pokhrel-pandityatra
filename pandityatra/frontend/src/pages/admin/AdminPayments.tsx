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
import { RefreshCcw, Loader2, CreditCard, RotateCcw } from "lucide-react";
import { fetchAdminPayments, refundPayment, type Payment } from "@/lib/api";

export default function AdminPayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminPayments();
            setPayments(data);
        } catch (error) {
            console.error("Failed to load payments", error);
            toast({
                title: "Error",
                description: "Failed to load payment ledger.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const handleRefund = async (id: number) => {
        if (!confirm("Are you sure you want to refund this payment? This action cannot be undone.")) return;
        
        try {
            await refundPayment(id);
            toast({
                title: "Refund Processed",
                description: "The payment has been successfully refunded.",
            });
            loadPayments();
        } catch (error: any) {
            toast({
                title: "Refund Failed",
                description: error.message || "Failed to process refund.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
            case "PAID":
                return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
            case "PENDING":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
            case "REFUNDED":
                return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Refunded</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatAmount = (p: Payment) => {
        if (p.currency === "NPR" || (p.amount_npr && p.amount_npr !== "0.00")) {
             return `Rs. ${p.amount_npr}`;
        }
        return `USD ${p.amount_usd}`;
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payments Ledger</h1>
                        <p className="text-muted-foreground">Monitor transactions, earnings, and handle refunds.</p>
                    </div>
                    <Button variant="outline" onClick={loadPayments}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue (Verified)</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs. {payments.filter(p => !['REFUNDED', 'FAILED'].includes(p.status)).reduce((acc, curr) => acc + parseFloat(curr.amount_npr || "0"), 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                + USD {payments.filter(p => !['REFUNDED', 'FAILED'].includes(p.status)).reduce((acc, curr) => acc + parseFloat(curr.amount_usd || "0"), 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    {/* Add more stats cards later if needed */}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Pandit</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Gateway</TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-6 w-6 animate-spin inline" />
                                                Loading Ledger...
                                            </TableCell>
                                        </TableRow>
                                    ) : payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-mono">#{p.booking_details?.id || p.booking}</TableCell>
                                                <TableCell>{p.user_details?.full_name || 'Unknown'}</TableCell>
                                                <TableCell>{p.booking_details?.pandit_name || 'Unknown'}</TableCell>
                                                <TableCell className="font-medium">{formatAmount(p)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="uppercase text-xs">
                                                        {p.payment_method}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {p.transaction_id || '-'}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(p.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {(p.status === 'COMPLETED' || p.status === 'PAID') && (
                                                        <Button 
                                                            variant="destructive" 
                                                            size="sm"
                                                            className="h-8 px-2"
                                                            onClick={() => handleRefund(p.id)}
                                                        >
                                                            <RotateCcw className="mr-2 h-3 w-3" />
                                                            Refund
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
