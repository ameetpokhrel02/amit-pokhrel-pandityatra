import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchAdminAllOrders,
    type ShopOrder 
} from "@/lib/api";
import { 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    Search,
    MapPin,
    Phone,
    User,
    Calendar,
    Loader2,
    Eye,
    Filter,
    ShoppingCart,
    ShieldCheck,
    CreditCard,
    FileText,
    Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminShopOrders() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const ordersPerPage = 8;
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminAllOrders(
        statusFilter === "all" ? undefined : statusFilter,
        roleFilter === "all" ? undefined : roleFilter
      );
      setOrders(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load marketplace orders.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, roleFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'PAID':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Paid</Badge>;
      case 'SHIPPED':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string | undefined) => {
    const r = role?.toLowerCase() || 'user';
    if (r === 'pandit') {
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 gap-1"><ShieldCheck className="h-3 w-3" /> PANDIT</Badge>;
    }
    return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><User className="h-3 w-3" /> CUSTOMER</Badge>;
  };

  const filteredOrders = orders.filter(order => 
    order.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm) ||
    order.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total_amount), 0);
  const panditOrders = orders.filter(o => o.buyer_role === 'pandit').length;

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Marketplace Oversight</h1>
            <p className="text-muted-foreground">Comprehensive monitoring of all samagri and book sales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={loadOrders}>
                <Clock className="h-4 w-4" /> Refresh Data
            </Button>
          </div>
        </div>

        {/* Global Marketplace Stats */}
        <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-white border-orange-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total GMV</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">NPR {totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white border-orange-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Orders</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{orders.length - panditOrders}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white border-orange-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pandit Orders</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{panditOrders}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white border-orange-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Fulfillment</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">
                                {orders.filter(o => ['PAID', 'SHIPPED'].includes(o.status)).length}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <Truck className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-orange-100">
          <CardHeader className="bg-white border-b py-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">Consolidated Order History</CardTitle>
                    <CardDescription>Filtering and monitoring across all buyer roles</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search ID, Customer, Email..." 
                        className="pl-9 h-10 w-full rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px] h-10">
                            <Filter className="h-3.5 w-3.5 mr-2" />
                            <SelectValue placeholder="Buyer Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="user">Customers</SelectItem>
                            <SelectItem value="pandit">Pandits</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-10">
                            <Filter className="h-3.5 w-3.5 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                <p className="font-medium text-gray-500 tracking-tight">Syncing global marketplace data...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Order ID</TableHead>
                    <TableHead className="font-bold text-gray-700">Buyer</TableHead>
                    <TableHead className="font-bold text-gray-700">Role</TableHead>
                    <TableHead className="font-bold text-gray-700">Total</TableHead>
                    <TableHead className="font-bold text-gray-700">Date</TableHead>
                    <TableHead className="font-bold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-bold text-gray-700 pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24">
                        <div className="max-w-[240px] mx-auto text-center space-y-4">
                            <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto" />
                            <p className="text-lg font-bold text-gray-400">No Marketplace Activity</p>
                            <p className="text-sm text-gray-400">Wait for users or pandits to place orders in the shop.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage).map((order) => (
                      <TableRow key={order.id} className="hover:bg-orange-50/20 transition-colors group">
                        <TableCell className="font-bold text-gray-600">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm">{order.full_name}</span>
                            <span className="text-[10px] text-gray-400">{order.user_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(order.buyer_role)}</TableCell>
                        <TableCell className="font-bold text-gray-900 text-sm">NPR {order.total_amount}</TableCell>
                        <TableCell className="text-gray-600 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right pr-6">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1.5 hover:bg-[#FF6B35] hover:text-white transition-all group-hover:shadow-md"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Inspect
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {!loading && filteredOrders.length > 0 && (
              <div className="p-4 bg-white border-t flex justify-center">
                  <DataTablePagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
                      onPageChange={setCurrentPage}
                  />
              </div>
          )}
        </Card>

        {/* Admin Order Insight Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            {selectedOrder && (
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                             <Badge variant="outline" className="bg-gray-100 text-gray-600 px-3 py-1 font-bold">MARKETPLACE ORDER</Badge>
                             {getRoleBadge(selectedOrder.buyer_role)}
                        </div>
                        <DialogTitle className="text-3xl font-black flex items-center justify-between pr-8">
                            Order #{selectedOrder.id}
                            {getStatusBadge(selectedOrder.status)}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                        <div className="md:col-span-2 space-y-4">
                            <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                                <h4 className="font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 text-orange-600" /> Buyer Profile
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                                        <p className="font-bold text-gray-800">{selectedOrder.full_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Contact</label>
                                        <p className="text-gray-600 flex items-center gap-2 mt-1 truncate"><FileText className="h-3.5 w-3.5" /> {selectedOrder.user_email}</p>
                                        <p className="text-gray-600 flex items-center gap-2 mt-1"><Phone className="h-3.5 w-3.5" /> {selectedOrder.phone_number}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50/30 p-5 rounded-2xl space-y-4 border border-orange-100">
                                <h4 className="font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-orange-600" /> Delivery Address
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p className="font-black text-gray-900 uppercase text-xs">{selectedOrder.city}</p>
                                    <p className="text-gray-700 leading-relaxed">{selectedOrder.shipping_address}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50/30 p-5 rounded-2xl space-y-4 border border-blue-100">
                                <h4 className="font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-blue-600" /> Payment Intelligence
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="font-bold text-gray-700">Method: <span className="text-blue-700">{selectedOrder.payment_method}</span></p>
                                    <p className="text-xs text-gray-500 break-all bg-white p-2 rounded border border-blue-100 font-mono">ID: {selectedOrder.transaction_id || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:col-span-3 space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="font-extrabold text-gray-900 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-orange-600" /> Fulfillment Summary
                                </h4>
                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">{selectedOrder.items.length} Items</span>
                            </div>
                            
                            <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
                                <div className="bg-gray-50/50 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase border-b grid grid-cols-4">
                                    <div className="col-span-2">Product</div>
                                    <div className="text-center">Qty</div>
                                    <div className="text-right">Price</div>
                                </div>
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-4 items-center p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <div className="col-span-2">
                                            <span className="font-bold text-sm text-gray-800 block">{item.item_name}</span>
                                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-tighter">Vendor: Shop #{idx + 1}</span>
                                        </div>
                                        <div className="text-center font-bold text-gray-600 text-sm">x{item.quantity}</div>
                                        <div className="text-right font-black text-gray-900 text-sm">NPR {Number(item.price_at_purchase) * item.quantity}</div>
                                    </div>
                                ))}
                                <div className="p-4 bg-orange-50 flex justify-between items-center border-t border-orange-100">
                                    <span className="font-bold text-orange-900">Final Marketplace Total:</span>
                                    <span className="text-2xl font-black text-gray-900 tracking-tighter">NPR {selectedOrder.total_amount}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-200">
                                    <Download className="h-4 w-4 mr-2" /> Global Invoice
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    Manage Escalation
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
