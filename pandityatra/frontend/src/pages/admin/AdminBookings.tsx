import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchBookings, adminCancelBooking, type Booking } from '@/lib/api';
import { Loader2, Search, Ban, CreditCard, RefreshCcw } from 'lucide-react';

const AdminBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await fetchBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load bookings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAndRefund = async (bookingId: number) => {
        if (!confirm('Are you sure you want to cancel this booking and initiate a refund?')) return;

        try {
            await adminCancelBooking(bookingId);
            toast({
                title: 'Success',
                description: 'Booking cancelled and refund process initiated.',
            });
            loadBookings(); // Refresh list
        } catch (error) {
            console.error('Cancel failed:', error);
            toast({
                title: 'Error',
                description: 'Failed to cancel booking',
                variant: 'destructive',
            });
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            (booking.pandit_full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.user_full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        
        const matchesDate = dateFilter ? booking.booking_date === dateFilter : true;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusBadge = (status: string) => {
        let className = "";
        let variant: "default" | "destructive" | "outline" | "secondary" = "outline";

        switch (status) {
            case 'COMPLETED':
                className = "bg-green-500 hover:bg-green-600 border-transparent text-primary-foreground";
                variant = "default";
                break;
            case 'ACCEPTED':
                className = "bg-blue-500 hover:bg-blue-600 border-transparent text-primary-foreground";
                variant = "default";
                break;
            case 'PENDING':
                className = "bg-yellow-500 hover:bg-yellow-600 border-transparent text-primary-foreground";
                variant = "secondary";
                break;
            case 'CANCELLED':
                variant = "destructive";
                break;
            default:
                variant = "outline";
        }

        return <Badge className={className} variant={variant}>{status}</Badge>;
    };

    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-3xl font-bold">Manage Bookings</h1>
                    <Button variant="outline" onClick={loadBookings}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bookings Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Pandit or Customer..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                className="w-[180px]"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                            {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setDateFilter('');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Pandit</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-6 w-6 animate-spin inline" />
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredBookings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No bookings found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBookings.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-medium">#{booking.id}</TableCell>
                                                <TableCell>{booking.user_full_name}</TableCell>
                                                <TableCell>{booking.pandit_full_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{booking.booking_date}</span>
                                                        <span className="text-xs text-muted-foreground">{booking.booking_time}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>₹{booking.total_fee}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {booking.payment_method ? (
                                                            <>
                                                                <CreditCard className="h-3 w-3" />
                                                                <span className="capitalize">{booking.payment_method}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">Unpaid</span>
                                                        )}
                                                        {booking.payment_status && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Paid</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleCancelAndRefund(booking.id)}
                                                        >
                                                            <Ban className="mr-2 h-3 w-3" />
                                                            Cancel & Refund
                                                        </Button>
                                                    )}
                                                    {booking.status === 'CANCELLED' && (
                                                        <span className="text-xs text-muted-foreground">Refunded via Gateway</span>
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
};

export default AdminBookings;