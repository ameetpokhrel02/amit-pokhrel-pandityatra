import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, Wallet, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings, fetchPandits } from "@/lib/api";
import type { Booking, Pandit } from "@/lib/api";

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nextBooking, setNextBooking] = useState<any>(null);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    spent: 0,
  });
  const [recommendations, setRecommendations] = useState<Pandit[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsRes, panditsRes] = await Promise.all([
          fetchBookings(),
          fetchPandits()
        ]);

        // 1. Process Bookings
        const upcoming = bookingsRes.filter((b) =>
          ["PENDING", "ACCEPTED"].includes(b.status)
        ).sort((a, b) => new Date(`${a.booking_date}T${a.booking_time}`).getTime() - new Date(`${b.booking_date}T${b.booking_time}`).getTime());

        const completed = bookingsRes.filter((b) => b.status === "COMPLETED");

        setNextBooking(upcoming[0] || null);
        setStats({
          upcoming: upcoming.length,
          completed: completed.length,
          spent: completed.reduce((sum, b) => sum + Number(b.total_fee || 0), 0),
        });

        // 2. Generate Activity Feed
        const activities = bookingsRes
          .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
          .slice(0, 5)
          .map(b => ({
            id: b.id,
            text: b.status === 'PENDING' ? `Request sent for ${b.service_name}` :
              b.status === 'ACCEPTED' ? `Booking confirmed with ${b.pandit_name}` :
                b.status === 'COMPLETED' ? `Completed ${b.service_name}` : `Cancelled ${b.service_name}`,
            date: b.booking_date,
            status: b.status
          }));
        setActivities(activities);

        // 3. Process Recommendations (Top rated)
        const topPandits = panditsRes
          .sort((a, b) => Number(b.rating) - Number(a.rating))
          .slice(0, 3);
        setRecommendations(topPandits);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    loadData();
  }, []);

  return (
    <DashboardLayout userRole="user">
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.full_name?.split(" ")[0]} 🙏
            </h1>
            <p className="text-muted-foreground">
              Your spiritual journey continues here
            </p>
          </div>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[200px] grid-cols-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN (2/3) */}
              <div className="lg:col-span-2 space-y-8">

                {/* NEXT PUJA */}
                <Card className="border-primary/30 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Next Puja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextBooking ? (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg">
                            {nextBooking.service_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            With {nextBooking.pandit_name}
                          </p>
                          <p className="text-sm">
                            {nextBooking.booking_date} at {nextBooking.booking_time}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {nextBooking.video_room_url && (
                            <Button
                              onClick={() =>
                                navigate(`/puja-room/${nextBooking.id}`)
                              }
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Join Video
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => navigate("/my-bookings")}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p>No upcoming puja scheduled.</p>
                        <Button onClick={() => navigate("/booking")}>
                          Book a Puja
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RECOMMENDATIONS */}
                <div>
                  <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map(pandit => (
                      <Card key={pandit.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/pandits/${pandit.id}`)}>
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                          <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                            {pandit.user_details.profile_pic_url ? (
                              <img src={pandit.user_details.profile_pic_url} alt={pandit.user_details.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-2xl pt-4 block text-gray-400">🕉</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{pandit.user_details.full_name}</p>
                            <p className="text-xs text-muted-foreground">{pandit.expertise}</p>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            ★ {pandit.rating}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                    {recommendations.length === 0 && (
                      <div className="col-span-3 text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                        Explore our pandits to get recommendations.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN (1/3) */}
              <div className="space-y-8">
                {/* QUICK STATS */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.upcoming}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-muted-foreground" /> ₹{stats.spent}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RECENT ACTIVITY */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.length > 0 ? (
                        activities.map((activity, i) => (
                          <div key={i} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${activity.status === 'ACCEPTED' ? 'bg-green-500' :
                              activity.status === 'COMPLETED' ? 'bg-blue-500' :
                                activity.status === 'CANCELLED' ? 'bg-red-500' : 'bg-orange-500'
                              }`} />
                            <div>
                              <p className="text-sm font-medium">{activity.text}</p>
                              <p className="text-xs text-muted-foreground">{activity.date}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI ASSISTANT CTA */}
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-none">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Need Guidance?</h3>
                    <p className="text-white/90 text-sm mb-4">Our AI assistant can help you find the right puja or answer spiritual questions.</p>
                    <Button variant="secondary" className="w-full text-primary" onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}>
                      Ask AI Guru
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
