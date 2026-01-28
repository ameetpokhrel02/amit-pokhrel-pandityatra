import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    growthRate: number;
  };
  userBehavior: {
    topPages: Array<{ page: string; views: number; bounceRate: number }>;
    userFlow: Array<{ step: string; users: number; dropoffRate: number }>;
    sessionDuration: number;
    returnVisitors: number;
  };
  bookingAnalytics: {
    byLocation: Array<{ location: string; count: number; revenue: number }>;
    byPuja: Array<{ puja: string; count: number; popularity: number }>;
    byTimeSlot: Array<{ time: string; bookings: number }>;
    conversionRate: number;
  };
  geographicData: {
    countries: Array<{ country: string; users: number; revenue: number }>;
    cities: Array<{ city: string; users: number; bookings: number }>;
    timezones: Array<{ timezone: string; users: number; peakHours: string[] }>;
  };
  panditPerformance: {
    topPandits: Array<{ name: string; bookings: number; rating: number; revenue: number }>;
    averageResponseTime: number;
    completionRate: number;
  };
  revenueAnalytics: {
    monthly: Array<{ month: string; revenue: number; bookings: number }>;
    byPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
    averageOrderValue: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { country, timezone } = useLocation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - in real implementation, this would fetch from backend
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 1247,
          totalBookings: 856,
          totalRevenue: 425600,
          averageRating: 4.7,
          growthRate: 23.5
        },
        userBehavior: {
          topPages: [
            { page: '/pandits', views: 3420, bounceRate: 32.1 },
            { page: '/shop/pujas', views: 2890, bounceRate: 28.5 },
            { page: '/booking', views: 2156, bounceRate: 15.2 },
            { page: '/', views: 4567, bounceRate: 45.3 }
          ],
          userFlow: [
            { step: 'Landing', users: 1000, dropoffRate: 0 },
            { step: 'Browse Pandits', users: 750, dropoffRate: 25 },
            { step: 'Select Service', users: 600, dropoffRate: 20 },
            { step: 'Booking Form', users: 480, dropoffRate: 20 },
            { step: 'Payment', users: 384, dropoffRate: 20 },
            { step: 'Confirmation', users: 345, dropoffRate: 10 }
          ],
          sessionDuration: 8.5,
          returnVisitors: 34.2
        },
        bookingAnalytics: {
          byLocation: [
            { location: 'ONLINE', count: 456, revenue: 228000 },
            { location: 'HOME', count: 234, revenue: 156000 },
            { location: 'TEMPLE', count: 123, revenue: 82000 },
            { location: 'PANDIT_LOCATION', count: 43, revenue: 29000 }
          ],
          byPuja: [
            { puja: 'Griha Pravesh', count: 145, popularity: 85 },
            { puja: 'Satyanarayan Puja', count: 123, popularity: 78 },
            { puja: 'Wedding Ceremony', count: 89, popularity: 92 },
            { puja: 'Bratabandha', count: 67, popularity: 71 }
          ],
          byTimeSlot: [
            { time: '06:00-09:00', bookings: 234 },
            { time: '09:00-12:00', bookings: 345 },
            { time: '12:00-15:00', bookings: 123 },
            { time: '15:00-18:00', bookings: 89 },
            { time: '18:00-21:00', bookings: 65 }
          ],
          conversionRate: 34.5
        },
        geographicData: {
          countries: [
            { country: 'Nepal', users: 567, revenue: 284000 },
            { country: 'India', users: 234, revenue: 117000 },
            { country: 'USA', users: 156, revenue: 78000 },
            { country: 'Australia', users: 89, revenue: 45000 },
            { country: 'UK', users: 67, revenue: 34000 }
          ],
          cities: [
            { city: 'Kathmandu', users: 345, bookings: 234 },
            { city: 'Pokhara', users: 123, bookings: 89 },
            { city: 'Delhi', users: 89, bookings: 67 },
            { city: 'Mumbai', users: 67, bookings: 45 },
            { city: 'Sydney', users: 45, bookings: 34 }
          ],
          timezones: [
            { timezone: 'Asia/Kathmandu', users: 567, peakHours: ['09:00', '18:00'] },
            { timezone: 'Asia/Kolkata', users: 234, peakHours: ['10:00', '19:00'] },
            { timezone: 'America/New_York', users: 89, peakHours: ['20:00', '22:00'] },
            { timezone: 'Australia/Sydney', users: 67, peakHours: ['07:00', '20:00'] }
          ]
        },
        panditPerformance: {
          topPandits: [
            { name: 'Ramesh Shastri', bookings: 89, rating: 4.9, revenue: 45000 },
            { name: 'Sita Devi', bookings: 67, rating: 4.8, revenue: 34000 },
            { name: 'Krishna Acharya', bookings: 56, rating: 4.7, revenue: 28000 },
            { name: 'Ganga Prasad', bookings: 45, rating: 4.6, revenue: 23000 }
          ],
          averageResponseTime: 2.3,
          completionRate: 94.5
        },
        revenueAnalytics: {
          monthly: [
            { month: 'Jan', revenue: 45000, bookings: 123 },
            { month: 'Feb', revenue: 52000, bookings: 145 },
            { month: 'Mar', revenue: 48000, bookings: 134 },
            { month: 'Apr', revenue: 61000, bookings: 167 },
            { month: 'May', revenue: 58000, bookings: 156 },
            { month: 'Jun', revenue: 67000, bookings: 189 }
          ],
          byPaymentMethod: [
            { method: 'Khalti', amount: 234000, percentage: 55 },
            { method: 'Stripe', amount: 156000, percentage: 37 },
            { method: 'Cash', amount: 35600, percentage: 8 }
          ],
          averageOrderValue: 497
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, change, icon, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}% from last period
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Insights and metrics for PanditYatra platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analyticsData.overview.totalUsers.toLocaleString()}
          change={analyticsData.overview.growthRate}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <MetricCard
          title="Total Bookings"
          value={analyticsData.overview.totalBookings.toLocaleString()}
          change={15.2}
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={`₹${(analyticsData.overview.totalRevenue / 1000).toFixed(0)}K`}
          change={28.7}
          icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
          color="yellow"
        />
        <MetricCard
          title="Avg Rating"
          value={analyticsData.overview.averageRating.toFixed(1)}
          change={2.1}
          icon={<Star className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
      </div>

      {/* Geographic Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.geographicData.countries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{country.country}</p>
                      <p className="text-sm text-gray-600">{country.users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(country.revenue / 1000).toFixed(0)}K</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-orange-500 rounded-full"
                        style={{ width: `${(country.revenue / analyticsData.overview.totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timezone Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.geographicData.timezones.map((tz) => (
                <div key={tz.timezone} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{tz.timezone}</p>
                    <Badge variant="outline">{tz.users} users</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Peak hours: {tz.peakHours.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Bookings by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.bookingAnalytics.byLocation.map((location) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{location.location}</p>
                    <p className="text-sm text-gray-600">{location.count} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(location.revenue / 1000).toFixed(0)}K</p>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full"
                        style={{ 
                          width: `${(location.count / analyticsData.overview.totalBookings) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Popular Pujas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.bookingAnalytics.byPuja.map((puja) => (
                <div key={puja.puja} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{puja.puja}</p>
                    <p className="text-sm text-gray-600">{puja.count} bookings</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={puja.popularity > 80 ? 'default' : 'outline'}
                      className={puja.popularity > 80 ? 'bg-green-500' : ''}
                    >
                      {puja.popularity}% popularity
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Behavior Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            User Journey & Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.userBehavior.userFlow.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{step.step}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{step.users} users</span>
                      {step.dropoffRate > 0 && (
                        <Badge variant="outline" className="text-red-600">
                          -{step.dropoffRate}% dropoff
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(step.users / analyticsData.userBehavior.userFlow[0].users) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Overall Conversion Rate: {analyticsData.bookingAnalytics.conversionRate}%</strong>
              <br />
              {analyticsData.userBehavior.userFlow[analyticsData.userBehavior.userFlow.length - 1].users} out of {analyticsData.userBehavior.userFlow[0].users} visitors complete the booking process.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Pandits Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Top Performing Pandits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.panditPerformance.topPandits.map((pandit, index) => (
              <div key={pandit.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="font-medium">{pandit.name}</p>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{pandit.bookings} bookings</p>
                  <p className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {pandit.rating}
                  </p>
                  <p className="font-semibold text-green-600">
                    ₹{(pandit.revenue / 1000).toFixed(0)}K revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;