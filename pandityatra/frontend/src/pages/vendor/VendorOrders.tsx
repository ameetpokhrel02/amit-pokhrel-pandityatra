import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchVendorOrders, 
    updateVendorOrderStatus,
    type ShopOrder 
} from "@/lib/api";
import { 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    MoreHorizontal,
    Search,
    MapPin,
    Phone,
    User,
    Calendar,
    ChevronDown,
    Loader2,
    Eye
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTablePagination } from "@/components/common/DataTablePagination";

export default function VendorOrders() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const ordersPerPage = 6;
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchVendorOrders();
      setOrders(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await updateVendorOrderStatus(orderId, status);
      toast({ title: "Order Updated", description: `Order #${orderId} marked as ${status.toLowerCase()}.` });
      loadOrders(); // Reload to see changes
    } catch (err) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
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

  const filteredOrders = orders.filter(order => 
    order.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  return (
    <DashboardLayout userRole="vendor">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Shop Orders</h1>
            <p className="text-muted-foreground">Monitor and fulfill your product orders</p>
          </div>
        </div>

        {/* Dashboard Quick Stats for Orders */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-blue-50 border-blue-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Processing</p>
                            <h3 className="text-2xl font-bold text-blue-900 mt-1">
                                {orders.filter(o => o.status === 'PAID').length}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Shipped</p>
                            <h3 className="text-2xl font-bold text-purple-900 mt-1">
                                {orders.filter(o => o.status === 'SHIPPED').length}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Truck className="h-5 w-5 text-purple-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Completed</p>
                            <h3 className="text-2xl font-bold text-green-900 mt-1">
                                {orders.filter(o => o.status === 'DELIVERED').length}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className="overflow-hidden border-none shadow-sm shadow-orange-100">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
            <div className="space-y-1">
                <CardTitle className="text-xl">Fulfillment List</CardTitle>
                <CardDescription>Order IDs and shipping labels</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Orders..." 
                className="pl-9 h-9 w-full rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                <p className="font-medium text-gray-500">Retrieving order database...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Order ID</TableHead>
                    <TableHead className="font-bold text-gray-700">Customer</TableHead>
                    <TableHead className="font-bold text-gray-700">Date</TableHead>
                    <TableHead className="font-bold text-gray-700">Items (My Products)</TableHead>
                    <TableHead className="font-bold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-bold text-gray-700">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24">
                        <div className="max-w-[200px] mx-auto text-center space-y-3">
                            <Package className="h-12 w-12 text-gray-200 mx-auto" />
                            <p className="text-lg font-bold text-gray-400">No Orders Yet</p>
                            <p className="text-sm text-gray-400">Keep adding products to get your first sale!</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage).map((order) => (
                      <TableRow key={order.id} className="hover:bg-orange-50/20 transition-colors">
                        <TableCell className="font-bold text-gray-600">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                {order.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className="font-medium text-gray-700">{order.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium text-gray-600">
                             {order.items.length} {order.items.length === 1 ? 'Product' : 'Products'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1.5"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                  disabled={order.status === 'SHIPPED' || order.status === 'DELIVERED'}
                                >
                                  <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                  disabled={order.status === 'DELIVERED'}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Delivered
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            {selectedOrder && (
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center justify-between pr-8">
                            Order Details #{selectedOrder.id}
                            {getStatusBadge(selectedOrder.status)}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <User className="h-4 w-4 text-orange-600" /> Customer Information
                                </h4>
                                <div className="space-y-1 pl-6 text-sm">
                                    <p className="font-medium">{selectedOrder.full_name}</p>
                                    <p className="text-gray-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {selectedOrder.phone_number}</p>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50/50 p-4 rounded-xl space-y-3 border border-orange-100">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-orange-600" /> Shipping Destination
                                </h4>
                                <div className="space-y-1 pl-6 text-sm leading-relaxed">
                                    <p className="font-medium">{selectedOrder.city}</p>
                                    <p className="text-gray-600">{selectedOrder.shipping_address}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 px-1">
                                <Package className="h-4 w-4 text-orange-600" /> Item Summary
                            </h4>
                            <div className="border rounded-xl bg-white overflow-hidden">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-800">{item.item_name}</span>
                                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                        </div>
                                        <span className="font-bold text-orange-600 text-sm">Rs. {Number(item.price_at_purchase) * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-2 px-1 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">My Subtotal:</span>
                                <span className="text-xl font-bold text-gray-900 leading-none">Rs. {selectedOrder.items.reduce((sum, item) => sum + (Number(item.price_at_purchase) * item.quantity), 0)}</span>
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
