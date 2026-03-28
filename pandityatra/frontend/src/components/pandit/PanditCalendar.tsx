import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    FaCalendarAlt,
    FaClock,
    FaUser,
    FaVideo,
    FaPlus,
    FaBan,
    FaEdit
} from 'react-icons/fa';
import { GiPrayerBeads } from 'react-icons/gi';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'booking' | 'blocked' | 'available';
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    extendedProps?: {
        customerName?: string;
        pujaType?: string;
        status?: string;
        price?: number;
        description?: string;
    };
}

interface BlockTimeData {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
}

interface PanditCalendarProps {
    festivalDateKeys?: string[];
}

export const PanditCalendar: React.FC<PanditCalendarProps> = ({ festivalDateKeys = [] }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [blockTimeData, setBlockTimeData] = useState<BlockTimeData>({
        date: '',
        startTime: '',
        endTime: '',
        reason: ''
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const isFestivalDate = (date: Date) => {
        const key = format(date, 'yyyy-MM-dd');
        return festivalDateKeys.includes(key);
    };

    // Mock data - replace with actual API calls
    useEffect(() => {
        loadCalendarEvents();
    }, []);

    const loadCalendarEvents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/pandits/me/calendar/');
            setEvents(response.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load calendar events",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (selectInfo: any) => {
        const selectedDate = selectInfo.dateStr;
        setBlockTimeData({
            ...blockTimeData,
            date: selectedDate
        });
        setIsBlockDialogOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const event = clickInfo.event;
        // Convert FullCalendar event to our CalendarEvent interface
        const calendarEvent: CalendarEvent = {
            id: event.id,
            title: event.title,
            start: event.start.toISOString(),
            end: event.end?.toISOString() || event.start.toISOString(),
            type: event.extendedProps.type || 'booking',
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            textColor: event.textColor,
            extendedProps: event.extendedProps
        };
        setSelectedEvent(calendarEvent);
    };

    const handleBlockTime = async () => {
        try {
            if (!blockTimeData.date || !blockTimeData.startTime || !blockTimeData.endTime) {
                toast({
                    title: "Error",
                    description: "Please fill all required fields",
                    variant: "destructive"
                });
                return;
            }

            const payload = {
                title: blockTimeData.reason || 'Unavailable',
                start_time: `${blockTimeData.date}T${blockTimeData.startTime}:00`,
                end_time: `${blockTimeData.date}T${blockTimeData.endTime}:00`,
            };

            const response = await apiClient.post('/pandits/me/calendar/', payload);

            // Reload to get properly formatted event from backend
            await loadCalendarEvents();

            setIsBlockDialogOpen(false);
            setBlockTimeData({ date: '', startTime: '', endTime: '', reason: '' });

            toast({
                title: "Success",
                description: "Time slot blocked successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to block time slot",
                variant: "destructive"
            });
        }
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'booking':
                return 'bg-primary text-primary-foreground';
            case 'blocked':
                return 'bg-red-500 text-white';
            case 'available':
                return 'bg-green-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-primary">My Calendar</h2>
                    <p className="text-muted-foreground">Manage your schedule and availability</p>
                </div>
                <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-500 hover:bg-red-600">
                            <FaBan className="h-4 w-4 mr-2" />
                            Block Time
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Block Time Slot</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={blockTimeData.date}
                                    onChange={(e) => setBlockTimeData({ ...blockTimeData, date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={blockTimeData.startTime}
                                        onChange={(e) => setBlockTimeData({ ...blockTimeData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={blockTimeData.endTime}
                                        onChange={(e) => setBlockTimeData({ ...blockTimeData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="reason">Reason (Optional)</Label>
                                <Input
                                    id="reason"
                                    placeholder="e.g., Personal work, Holiday"
                                    value={blockTimeData.reason}
                                    onChange={(e) => setBlockTimeData({ ...blockTimeData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleBlockTime} className="bg-red-500 hover:bg-red-600">
                                    Block Time
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Calendar */}
            <Card>
                <CardContent className="p-6">
                    <style>{`
                        .fc .fc-daygrid-day.festival-day {
                            background-color: #fff7ed;
                        }
                        .fc .fc-daygrid-day.festival-day .fc-daygrid-day-number {
                            position: relative;
                            color: #c2410c;
                            font-weight: 700;
                        }
                        .fc .fc-daygrid-day.festival-day .fc-daygrid-day-number::after {
                            content: '';
                            width: 6px;
                            height: 6px;
                            border-radius: 9999px;
                            background: #f97316;
                            display: inline-block;
                            margin-left: 6px;
                            vertical-align: middle;
                        }
                        .fc .festival-header {
                            background: #fff7ed !important;
                            color: #c2410c !important;
                            font-weight: 700;
                        }
                    `}</style>
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            initialView="timeGridWeek"
                            editable={false}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            dayCellClassNames={(arg) => (isFestivalDate(arg.date) ? ['festival-day'] : [])}
                            dayHeaderClassNames={(arg) => (isFestivalDate(arg.date) ? ['festival-header'] : [])}
                            height="auto"
                            slotMinTime="06:00:00"
                            slotMaxTime="22:00:00"
                            businessHours={{
                                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                                startTime: '06:00',
                                endTime: '22:00'
                            }}
                            eventDisplay="block"
                            displayEventTime={true}
                            allDaySlot={false}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Event Details Dialog */}
            {selectedEvent && (
                <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {selectedEvent.type === 'booking' ? (
                                    <GiPrayerBeads className="h-5 w-5 text-primary" />
                                ) : (
                                    <FaBan className="h-5 w-5 text-red-500" />
                                )}
                                {selectedEvent.title}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className={getEventTypeColor(selectedEvent.type)}>
                                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {new Date(selectedEvent.start).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaClock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {selectedEvent.extendedProps?.customerName && (
                                <div className="flex items-center gap-2">
                                    <FaUser className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{selectedEvent.extendedProps.customerName}</span>
                                </div>
                            )}

                            {selectedEvent.extendedProps?.pujaType && (
                                <div className="flex items-center gap-2">
                                    <GiPrayerBeads className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{selectedEvent.extendedProps.pujaType}</span>
                                </div>
                            )}

                            {selectedEvent.extendedProps?.price && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        Price: ₹{selectedEvent.extendedProps.price}
                                    </span>
                                </div>
                            )}

                            {selectedEvent.extendedProps?.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedEvent.extendedProps.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                {selectedEvent.type === 'booking' && (
                                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                        <FaVideo className="h-4 w-4 mr-2" />
                                        Join Puja
                                    </Button>
                                )}
                                <Button size="sm" variant="outline">
                                    <FaEdit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};