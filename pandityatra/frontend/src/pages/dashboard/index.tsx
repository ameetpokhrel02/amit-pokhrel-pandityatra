import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetchBookings } from "@/lib/api";
import { MessageCircle } from "lucide-react";

export default function CustomerDashboard() {
  const [nextBooking, setNextBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bookings = await fetchBookings();
        // Assuming bookings is an array sorted by date, get the next one
        const now = new Date();
        const next = bookings.find(
          (b: any) => new Date(b.date) >= now
        );
        setNextBooking(next || null);
      } catch {
        setNextBooking(null);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardLayout userRole="user">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Next Booking</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : nextBooking ? (
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-lg">{nextBooking.pujaName}</div>
                <div>Date: {nextBooking.date}</div>
                <div>Time: {nextBooking.time}</div>
                <div>Pandit: {nextBooking.panditName}</div>
                {(() => {
                  const sessionDate = new Date(`${nextBooking.date}T${nextBooking.time}`);
                  const now = new Date();
                  const isPastDay = new Date(now.toDateString()) > new Date(sessionDate.toDateString());
                  const isPastHour = now > new Date(sessionDate.getTime() + 1 * 60 * 60 * 1000);
                  const isPast = isPastDay || isPastHour;

                  if (isPast) {
                    return (
                      <div className="mt-2 text-red-600 text-sm font-bold flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        Missed Session
                      </div>
                    );
                  }

                  return (
                    <Button onClick={() => navigate(`/video/${nextBooking.id}`)} className="mt-2">
                      Join Video
                    </Button>
                  );
                })()}
              </div>
            ) : (
              <div>No upcoming bookings.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div>Need help booking or choosing a puja?</div>
              <Button variant="outline" onClick={() => navigate("/dashboard/guide")}>Ask AI Guide <MessageCircle className="inline ml-2 w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
