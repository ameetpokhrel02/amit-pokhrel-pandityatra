import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Calendar, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout userRole="user">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <span className="text-muted-foreground">Welcome back, {user?.full_name || 'User'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Book a Pandit</CardTitle>
              <CardDescription>Find and book pandits</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/booking">
                <Button className="w-full">Browse Pandits</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>View upcoming ceremonies</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                View Bookings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <User className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;

