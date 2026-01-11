import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const PanditBookings = () => {
    // Defines dummy data for now
  const bookings = [
    { id: 1, service: "Ganesh Puja", date: "2024-03-20", time: "10:00 AM", status: "confirmed", client: "Amit Sharma" },
    { id: 2, service: "Satyanarayan Puja", date: "2024-03-22", time: "09:00 AM", status: "pending", client: "Sita Verma" },
  ]

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">Manage your upcoming and past service requests.</p>
        </div>

        <div className="grid gap-4">
            {bookings.map((booking) => (
                <Card key={booking.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl">{booking.service}</CardTitle>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            <p>Client: {booking.client}</p>
                            <p>Date: {booking.date}</p>
                            <p>Time: {booking.time}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline">View Details</Button>
                            {booking.status === 'pending' && (
                                <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                                    <Button size="sm" variant="destructive">Decline</Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PanditBookings
