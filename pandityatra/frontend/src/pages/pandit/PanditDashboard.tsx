import React, { useEffect, useState } from 'react'
import { VerificationWall } from '@/components/dashboard/VerificationWall';
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import apiClient from '@/lib/api-client'
import { useToast } from "@/hooks/use-toast"
import { PanditCalendar } from '@/components/pandit/PanditCalendar'
import { fetchSiteReviews, submitSiteReview } from '@/lib/api'
import {
    Calendar as CalendarIcon,
    Wallet,
    Clock,
    CheckCircle2,
    MapPin,
    Video,
    TrendingUp,
    AlertCircle,
    Loader2,
    Star,
    Send,
    MessageSquareHeart,
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
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [nextPuja, setNextPuja] = useState<any>(null)
    const [queue, setQueue] = useState<any[]>([])
    const [todaySchedule, setTodaySchedule] = useState<any[]>([])
    const [isOnline, setIsOnline] = useState(false)
    const [errorStatus, setErrorStatus] = useState<'PENDING' | 'REJECTED' | 'INCOMPLETE' | null>(null);

    // App Feedback state
    const [feedbackRating, setFeedbackRating] = useState(0)
    const [feedbackComment, setFeedbackComment] = useState('')
    const [feedbackHover, setFeedbackHover] = useState(0)
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [appAvgRating, setAppAvgRating] = useState(0)
    const [appTotalReviews, setAppTotalReviews] = useState(0)

    // Determine default tab from URL
    const urlTab = searchParams.get('tab')
    const defaultTab = urlTab === 'feedback' ? 'feedback' : 'overview'

    useEffect(() => {
        fetchDashboardData()
        // Load app review stats
        fetchSiteReviews().then(data => {
            setAppAvgRating(data.average_rating)
            setAppTotalReviews(data.total_reviews)
        }).catch(() => { })
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await apiClient.get('/pandits/dashboard/stats/')
            const data = res.data
            setStats(data.stats)
            setIsOnline(data.stats.is_online)
            setNextPuja(data.next_puja)
            setQueue(data.queue)
            setTodaySchedule(data.schedule || [])

            if (!data.stats.is_verified && data.stats.verification_status !== 'APPROVED') {
                setErrorStatus(data.stats.verification_status);
            }
        } catch (error: any) {
            console.error("Error fetching dashboard data", error)
            if (error.response?.status === 404) {
                setErrorStatus('INCOMPLETE');
            } else {
                toast({ title: "Error", description: "Could not load dashboard data", variant: "destructive" })
            }
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

    const handleBookingAction = async (id: number, actionName: string) => {
        const status = actionName === 'Accept' ? 'ACCEPTED' : 'CANCELLED'
        try {
            await apiClient.patch(`/bookings/${id}/update_status/`, { status })
            toast({ title: "Success", description: `Booking ${status.toLowerCase()}` })
            fetchDashboardData() // Refresh data
        } catch (error) {
            toast({ title: "Error", description: "Failed to update booking", variant: "destructive" })
        }
    }

    const handleFeedbackSubmit = async () => {
        if (feedbackRating === 0) {
            toast({ title: '⭐ Please select a rating', className: 'bg-red-600 text-white border-none shadow-2xl' })
            return
        }
        if (!feedbackComment.trim()) {
            toast({ title: '✏️ Please write your feedback', className: 'bg-red-600 text-white border-none shadow-2xl' })
            return
        }
        setFeedbackSubmitting(true)
        try {
            await submitSiteReview({ rating: feedbackRating, comment: feedbackComment.trim() })
            setFeedbackSubmitted(true)
            toast({ title: '✅ Feedback submitted!', description: 'Thank you for sharing your experience.', className: 'bg-green-600 text-white border-none shadow-2xl' })
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Failed to submit feedback.'
            toast({ title: 'Error', description: msg, className: 'bg-red-600 text-white border-none shadow-2xl' })
        } finally {
            setFeedbackSubmitting(false)
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

    if (errorStatus) {
        return (
            <DashboardLayout userRole="pandit">
                <VerificationWall role="pandit" status={errorStatus} />
            </DashboardLayout>
        );
    }

    const statsCards = [
        {
            title: t('todays_bookings'),
            value: stats?.todays_bookings || "0",
            icon: CalendarIcon,
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
            <div className="space-y-6">
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

                {/* Quick Actions */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/pandit/services'}>
                        Add New Service
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/pandit/calendar'}>
                        Open Calendar
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/pandit/messages'}>
                        View Messages
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/pandit/earnings'}>
                        Withdraw Earnings
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full md:w-[520px] grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="feedback" className="gap-1.5">
                            <MessageSquareHeart className="h-4 w-4" />
                            App Feedback
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-4">
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

                                {/* Today's Schedule (New Widget) */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                            Today's Schedule
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {todaySchedule.length > 0 ? (
                                            <div className="space-y-4">
                                                {todaySchedule.map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-center min-w-[60px]">
                                                                <div className="font-bold text-lg">{format(new Date(`2000-01-01T${item.time}`), 'h:mm')}</div>
                                                                <div className="text-xs text-muted-foreground">{format(new Date(`2000-01-01T${item.time}`), 'a')}</div>
                                                            </div>
                                                            <div className="h-8 w-px bg-border" />
                                                            <div>
                                                                <p className="font-medium">{item.title}</p>
                                                                <p className="text-sm text-muted-foreground">{item.customer}</p>
                                                                <div className="mt-1">
                                                                    <Badge variant="outline" className={item.payment_status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                                                                        {item.payment_status ? 'Paid' : 'Unpaid'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={item.status === 'ACCEPTED' ? 'default' : 'secondary'}>{item.status}</Badge>
                                                            {item.video_link && (
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100" onClick={() => window.open(item.video_link, '_blank')}>
                                                                    <Video className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                                                No bookings scheduled for today.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Next Puja Card */}
                                {nextPuja && (
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
                                            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                                                <Wallet className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Payment</p>
                                                    <Badge variant="outline" className={nextPuja.payment_status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                                                        {nextPuja.payment_status ? `Paid${nextPuja.payment_method ? ` (${nextPuja.payment_method})` : ''}` : 'Unpaid'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex gap-3 justify-end pt-2">
                                            <Button variant="outline" className="gap-2" onClick={() => handleBookingAction(nextPuja.id, 'Completed')}>
                                                <CheckCircle2 className="h-4 w-4" />
                                                {t('mark_completed')}
                                            </Button>
                                            {nextPuja.videoLink && (
                                                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(nextPuja.videoLink, '_blank')}>
                                                    <Video className="h-4 w-4" />
                                                    {t('join_video')}
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )}

                                {/* Booking Queue */}
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
                                                        <TableHead>Payment</TableHead>
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
                                                            <TableCell>
                                                                <Badge variant="outline" className={booking.payment_status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                                                                    {booking.payment_status ? `Paid${booking.payment_method ? ` (${booking.payment_method})` : ''}` : 'Unpaid'}
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
                                        <Button variant="link" size="sm" onClick={() => window.location.href = '/pandit/bookings'}>{t('view_all')}</Button>
                                    </CardFooter>
                                </Card>

                            </div>

                            {/* Right Sidebar */}
                            <div className="md:col-span-2 space-y-6">
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
                                        <Button className="w-full" variant="outline" onClick={() => window.location.href = '/pandit/earnings'}>{t('view_wallet')}</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-4">
                        <PanditCalendar />
                    </TabsContent>

                    {/* App Feedback Tab */}
                    <TabsContent value="feedback" className="mt-4">
                        <div className="max-w-2xl mx-auto space-y-6">
                            {/* App Rating Overview */}
                            <Card className="border-orange-100 bg-gradient-to-r from-orange-50/50 to-white">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-orange-100">
                                            <Star className="h-6 w-6 text-orange-600 fill-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">PanditYatra App Rating</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={16} className={s <= Math.round(appAvgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                                <span className="font-bold text-lg">{appAvgRating}</span>
                                                <span className="text-sm text-muted-foreground">({appTotalReviews} reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feedback Form */}
                            {feedbackSubmitted ? (
                                <Card className="border-green-200 bg-green-50/30">
                                    <CardContent className="py-12 text-center">
                                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-green-800">Thank You!</h3>
                                        <p className="text-green-600 mt-2">
                                            Your feedback has been submitted successfully.
                                            <br />It will be reviewed and published on our platform.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MessageSquareHeart className="h-5 w-5 text-orange-600" />
                                            Share Your Feedback About PanditYatra
                                        </CardTitle>
                                        <CardDescription>
                                            How has your experience been as a pandit on our platform? Your feedback helps us improve.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Star Selector */}
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-2">
                                                How would you rate PanditYatra?
                                            </label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setFeedbackRating(s)}
                                                        onMouseEnter={() => setFeedbackHover(s)}
                                                        onMouseLeave={() => setFeedbackHover(0)}
                                                        className="transition-transform hover:scale-125 p-1"
                                                    >
                                                        <Star
                                                            size={32}
                                                            className={s <= (feedbackHover || feedbackRating)
                                                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                                                : 'text-gray-300'}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            {feedbackRating > 0 && (
                                                <p className="text-sm text-orange-600 mt-1 font-medium">
                                                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackRating]}
                                                </p>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-1.5">
                                                Your Feedback
                                            </label>
                                            <Textarea
                                                placeholder="Share your experience — what you like, what can be improved, how it has helped your work as a pandit..."
                                                value={feedbackComment}
                                                onChange={e => setFeedbackComment(e.target.value)}
                                                className="min-h-[120px] border-slate-200 focus:border-orange-400"
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">{feedbackComment.length}/500</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            onClick={handleFeedbackSubmit}
                                            disabled={feedbackSubmitting}
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold text-base py-5"
                                        >
                                            {feedbackSubmitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <Send className="h-5 w-5 mr-2" />
                                            )}
                                            Submit Feedback
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

export default PanditDashboard
