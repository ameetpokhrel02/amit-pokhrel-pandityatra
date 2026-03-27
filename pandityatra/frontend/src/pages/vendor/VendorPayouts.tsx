import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchVendorStats, 
    fetchVendorPayouts, 
    requestVendorPayout,
    type VendorStats,
    type VendorPayout 
} from "@/lib/api";
import { 
    Wallet, 
    TrendingUp, 
    ArrowUpCircle, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Landmark,
    DollarSign,
    Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function VendorPayouts() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, payoutsData] = await Promise.all([
          fetchVendorStats(),
          fetchVendorPayouts()
      ]);
      setStats(statsData);
      setPayouts(payoutsData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load financial data.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
        return;
    }
    
    if (stats && Number(amount) > stats.current_balance) {
        toast({ title: "Insufficient Balance", description: "You cannot withdraw more than your current balance.", variant: "destructive" });
        return;
    }

    setRequestLoading(true);
    try {
      await requestVendorPayout(Number(amount));
      toast({ title: "Request Submitted", description: `Your payout request of Rs. ${amount} is pending approval.` });
      setAmount("");
      loadData(); // Reload data
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to submit payout request.", variant: "destructive" });
    }
    setRequestLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Pending</Badge>;
      case 'PAID':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout userRole="vendor">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Earnings & Payouts</h1>
            <p className="text-muted-foreground">Manage your finances and track withdrawals</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 h-11 px-6">
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Request Withdrawal</DialogTitle>
                    <DialogDescription>Your funds will be transferred to your registered bank account.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestPayout} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Withdrawal Amount (NPR)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 font-bold text-gray-400">Rs.</span>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="pl-10 h-11 text-lg font-bold"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="100"
                                required
                            />
                        </div>
                        {stats && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Wallet className="h-3 w-3" /> Available Balance: <span className="font-bold text-gray-800">Rs. {stats.current_balance}</span>
                            </p>
                        )}
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                        <Landmark className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Bank Account Transfer</p>
                            <p>Funds will be credited to the account provided during registration within 2-3 business days after approval.</p>
                        </div>
                    </div>
                    
                    <Button type="submit" className="w-full bg-orange-600 h-12 text-lg font-bold" disabled={requestLoading || !amount}>
                        {requestLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Withdrawal"}
                    </Button>
                </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Wallet className="h-24 w-24 -mr-6 -mt-6" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100 uppercase tracking-wider">Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">Rs. {stats?.current_balance || 0}</div>
                    <p className="text-xs text-orange-200 mt-1">Available for withdrawal</p>
                </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm shadow-orange-100">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-800">Rs. {stats?.total_revenue || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">Accumulated from all sales</p>
                </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm shadow-orange-100">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Withdrawn</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-800">Rs. {stats?.total_withdrawn || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Successfully transferred to bank</p>
                </CardContent>
            </Card>
        </div>

        <Card className="border-none shadow-sm shadow-orange-100 overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-xl">Payout History</CardTitle>
            <CardDescription>Track all your withdrawal requests and their status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                <p className="text-gray-500 font-medium">Syncing with ledger...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Transaction ID</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold text-right">Amount</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-right">Paid At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-10 w-10 text-gray-200" />
                          <p className="text-lg font-bold text-gray-400">No Withdrawal History</p>
                          <p className="text-sm text-gray-400">Your payout requests will appear here once you make them.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((payout) => (
                      <TableRow key={payout.id} className="group hover:bg-orange-50/30 transition-colors">
                        <TableCell className="font-mono text-xs text-gray-500">
                            {payout.transaction_id || `REQ-${payout.id}`}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-600">
                            {new Date(payout.requested_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-800">Rs. {payout.amount}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-right text-sm text-gray-500">
                            {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Help Tip */}
        <div className="flex items-start gap-4 p-5 bg-orange-50 text-orange-800 rounded-2xl border border-orange-100 shadow-sm">
          <div className="p-2 bg-orange-100 rounded-full">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="font-bold">Withdrawal Policy</p>
            <p className="text-sm opacity-90 leading-relaxed">
              Payouts are processed twice a week (Monday and Thursday). Minimum withdrawal amount is Rs. 100.
              Please ensure your bank information is correct to avoid payment delays. For any issues, 
              contact <span className="underline font-bold">vendor-support@pandityatra.com</span>.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
