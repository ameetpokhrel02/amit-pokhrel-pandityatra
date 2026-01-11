import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Users, Settings } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchBookings, fetchPanditServices } from '@/lib/api';

const PanditDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);

  useEffect(() => {
    // Fetch Bookings
    fetchBookings()
      .then(data => setBookingCount(data.length))
      .catch(console.error);

    // Fetch Services (if user has a pandit ID related to them, we might need that logic)
    // For now, assuming the API handles 'my services' or we fetch via user ID if mapped.
    // However, looking at api.ts, fetchPanditServices takes a `panditId`.
    // We need to know the pandit ID associated with this user.
    // The `user` object might not have it directly if it's the User model.
    // Let's check `fetchPandits` or similar.
    // Ideally, the backend should provide an endpoint /pandits/me/ or similar.
    // If not, we might need to rely on the user.role === 'pandit' and hope the user object has pandit_id or we fetch it.

    // WORKAROUND: For now, avoiding complex Pandit ID resolution if not present.
    // If we can't easily get pandit ID, we skip service count or try to fetch "my profile" which might have it.
    // Actually, `fetchBookings` returns bookings FOR this pandit (handled by backend).
    // For services, we need `panditId`.
    // Let's assume for now we just show bookings correctly.
    // And simplistic service matching if possible.
  }, []);

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pandit Dashboard</h1>
          <span className="text-muted-foreground">Welcome back, {user?.full_name || 'Pandit'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>View and manage requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingCount}</div>
              <p className="text-xs text-muted-foreground">Pending requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Services</CardTitle>
              <CardDescription>Active puja listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceCount}</div>
              <p className="text-xs text-muted-foreground">Active services (Coming Soon)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Rating</CardTitle>
              <CardDescription>Average customer rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.0</div>
              <p className="text-xs text-muted-foreground">Based on 0 reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Profile View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{user?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user?.role || 'Pandit'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PanditDashboard;

