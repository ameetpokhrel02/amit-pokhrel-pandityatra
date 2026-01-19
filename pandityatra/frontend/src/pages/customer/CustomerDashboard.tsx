import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings } from "@/lib/api";
import type { Booking } from "@/lib/api";

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nextBooking, setNextBooking] = useState<any>(null);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    spent: 0,
  });

  useEffect(() => {
    fetchBookings().then((res: Booking[]) => {
      if (!res) return;

      const upcoming = res.filter((b) =>
        ["PENDING", "ACCEPTED"].includes(b.status)
      );
      const completed = res.filter((b) => b.status === "COMPLETED");

      setNextBooking(upcoming[0] || null);
      setStats({
        upcoming: upcoming.length,
        completed: completed.length,
        spent: completed.reduce((sum, b) => sum + Number(b.total_fee || 0), 0),
      });
    });
  }, []);

  return (
    <DashboardLayout userRole="user">
      <div className="space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.full_name?.split(" ")[0]} 🙏
          </h1>
          <p className="text-muted-foreground">
            Your spiritual journey continues here
          </p>
        </div>

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
                <Button onClick={() => navigate("/pandits")}>
                  Book a Puja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.upcoming}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.completed}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Spent</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold flex items-center gap-1">
              <Wallet className="h-5 w-5" /> ₹{stats.spent}
            </CardContent>
          </Card>
        </div>

        {/* AI ASSISTANT */}
        <Card>
          <CardHeader>
            <CardTitle>Ask PanditYatra AI</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Get personalized spiritual guidance instantly
            </p>
            <Button onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}>
              Ask Now
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
