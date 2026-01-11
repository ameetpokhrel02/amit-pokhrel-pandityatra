import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import apiClient from '@/lib/api-client'
import { useToast } from "@/hooks/use-toast"
import { 
    Calendar, 
    Wallet, 
    Clock, 
    CheckCircle2, 
    MapPin, 
    Video, 
    TrendingUp,
    AlertCircle,
    Loader2
} from "lucide-react"
import { format } from "date-fns"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const PanditDashboard = () => {
    const { t } = useTranslation('dashboard')
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nextPuja, setNextPuja] = useState<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [queue, setQueue] = useState<any[]>([])
    const [isOnline, setIsOnline] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await apiClient.get('/pandits/dashboard/stats/')
            const data = res.data
            setStats(data.stats)
            setIsOnline(data.stats.is_online)
            setNextPuja(data.next_puja)
            setQueue(data.queue)
        } catch (error) {
            console.error("Error fetching dashboard data", error)
            toast({ title: "Error", description: "Could not load dashboard data", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleOnline = async (val: boolean) => {
        const previousState = isOnline
        setIsOnline(val) 
        try {
            await apiClient.post('/pandits/dashboard/toggle-availability/')
            toast({ 
                title: val ? "You are Online" : "You are Offline", 
                description: val ? "Customers can now send booking requests." : "Your profile is hidden from search." 
            })
        } catch (error) {
            setIsOnline(previousState)
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const handleBookingAction = async (id: number, actionName: string) => { // 'Accept' or 'Decline'
         const status = actionName === 'Accept' ? 'ACCEPTED' : 'CANCELLED'
         try {
            await apiClient.patch(`/bookings/${id}/update_status/`, { status })
            toast({ title: "Success", description: `Booking ${status.toLowerCase()}` })
            fetchDashboardData() // Refresh data
        } catch (error) {
            toast({ title: "Error", description: "Failed to update booking", variant: "destructive" })
        }
    }

    if (loading) {
        return (
            <DashboardLayout userRole="pandit">
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        )
    }

    const statsCards = [
        { 
            title: t('todays_bookings'), 
            value: stats?.todays_bookings || "0", 
            icon: Calendar, 
            description: t('scheduled_today'),
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        { 
            title: t('pending_requests'), 
            value: stats?.pending_requests || "0", 
            icon: AlertCircle, 
            description: t('requires_attention'),
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        { 
            title: t('todays_earnings'), 
            value: `₹ ${stats?.todays_earnings || 0}`, 
            icon: TrendingUp, 
            description: t('completed_today'),
            color: "text-green-600",
            bg: "bg-green-100"
        },
        { 
            title: t('available_balance'), 
            value: `₹ ${stats?.available_balance || 0}`, 
            icon: Wallet, 
            description: t('ready_withdraw'),
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
    ]

    return (
        <DashboardLayout userRole="pandit">
            <div className="space-y-8">
                {/* Header & Switch */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('command_center')}</h1>
                        <p className="text-muted-foreground">{t('manage_day')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-card p-2 px-4 rounded-full border shadow-sm">
                        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {isOnline ? `🟢 ${t('accepting_bookings')}` : `🔴 ${t('you_are_offline')}`}
                        </span>
                        <Switch 
                            checked={isOnline} 
                            onCheckedChange={handleToggleOnline} 
                            aria-label="Toggle availability"
                        />
                    </div>
                </div>

                {/* 1. Top Stats Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statsCards.map((stat, index) => (
                        <Card key={index} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-8 md:grid-cols-7">
                    
                    {/* Main Content Area (Left 5 Cols) */}
                    <div className="md:col-span-5 space-y-8">
                        
                        {/* 2. Next Puja Card (Highlighted) */}
                        {nextPuja ? (
                            <Card className="border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-transparent">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="outline" className="mb-2 bg-background">{t('upcoming')}</Badge>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                🕉 {nextPuja.pujaName}
                                            </CardTitle>
                                            <CardDescription className="text-base mt-1">
                                                with {nextPuja.customerName}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{format(new Date(`2000-01-01T${nextPuja.time}`), 'h:mm a')}</div>
                                            <div className="text-sm text-muted-foreground">{nextPuja.date}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p className="font-medium">{nextPuja.location === 'ONLINE' ? 'Online (Video Call)' : nextPuja.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <p className="font-medium text-green-600">{nextPuja.status}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-3 justify-end pt-2">
                                    <Button variant="outline" className="gap-2" onClick={() => handleBookingAction(nextPuja.id, 'Completed')}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t('mark_completed')}
                                    </Button>
                                    {nextPuja.videoLink && (
                                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open(nextPuja.videoLink, '_blank')}>
                                            <Video className="h-4 w-4" />
                                            {t('join_video')}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ) : (
                            <Card className="bg-muted/40">
                                <CardHeader>
                                     <CardTitle className="text-muted-foreground">{t('no_upcoming')}</CardTitle>
                                     <CardDescription>{t('no_upcoming_desc')}</CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {/* 3. Booking Queue (Action Table) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('booking_queue')}</CardTitle>
                                <CardDescription>{t('manage_queue')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {queue.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('customer')}</TableHead>
                                            <TableHead>{t('puja')}</TableHead>
                                            <TableHead>{t('date_time')}</TableHead>
                                            <TableHead>{t('status')}</TableHead>
                                            <TableHead className="text-right">{t('action')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {queue.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-medium">{booking.customer}</TableCell>
                                                <TableCell>{booking.service}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{booking.date}</div>
                                                    <div className="text-xs text-muted-foreground">{booking.time}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={booking.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {booking.status === 'PENDING' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleBookingAction(booking.id, 'Accept')}>{t('accept')}</Button>
                                                            <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-700" onClick={() => handleBookingAction(booking.id, 'Decline')}>{t('decline')}</Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="h-8">{t('details')}</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground">{t('no_upcoming_desc')}</div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-center border-t p-4">
                                <Button variant="link" size="sm" onClick={() => window.location.href='/pandit/bookings'}>{t('view_all')}</Button>
                            </CardFooter>
                        </Card>

                    </div>

                    {/* Right Sidebar (Stats & Quick Actions) */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* 4. Earnings Snapshot */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('earnings')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">{t('this_week')}</span>
                                    <span className="font-bold">₹ {stats?.week_earnings || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">{t('this_month')}</span>
                                    <span className="font-bold">₹ {stats?.month_earnings || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-muted-foreground">{t('lifetime')}</span>
                                    <span className="font-bold text-green-600">₹ {stats?.total_earned || 0}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" onClick={() => window.location.href='/pandit/earnings'}>{t('view_wallet')}</Button>
                            </CardFooter>
                        </Card>

                    </div>

                </div>
            </div>
        </DashboardLayout>
    )
}

export default PanditDashboard
