import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    extendedProps: {
        type: 'booking' | 'block';
        status?: string;
        location?: string;
    };
}

export const PanditCalendar = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<{ start: string; end: string } | null>(null);
    const [blockReason, setBlockReason] = useState('Unavailable');

    // Selected Event to Delete
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/pandits/me/calendar/');
            setEvents(res.data);
        } catch (error) {
            console.error("Failed to fetch calendar", error);
            toast({
                title: "Error",
                description: "Failed to load schedule.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDateSelect = (selectInfo: any) => {
        // Open Dialog
        setSelectedDate({
            start: selectInfo.startStr,
            end: selectInfo.endStr
        });
        setIsDialogOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const type = clickInfo.event.extendedProps.type;
        if (type === 'block') {
            if (confirm(`Delete this blocked slot: "${clickInfo.event.title}"?`)) {
                // Extract ID from "block-123"
                const id = clickInfo.event.id.replace('block-', '');
                handleDeleteBlock(id);
            }
        } else {
            // Booking details logic can go here (or open a modal)
            toast({
                title: clickInfo.event.title,
                description: `Location: ${clickInfo.event.extendedProps.location || 'Online'} - ${clickInfo.event.extendedProps.status}`,
            });
        }
    };

    const handleCreateBlock = async () => {
        if (!selectedDate) return;

        try {
            await apiClient.post('/pandits/me/calendar/', {
                start_time: selectedDate.start,
                end_time: selectedDate.end,
                title: blockReason
            });
            toast({ title: "Availability Updated", description: "Time slot marked as unavailable." });
            setIsDialogOpen(false);
            setBlockReason('Unavailable');
            fetchEvents(); // Refresh
        } catch (error) {
            toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
        }
    };

    const handleDeleteBlock = async (id: string) => {
        try {
            await apiClient.delete(`/pandits/me/calendar/blocks/${id}/`);
            toast({ title: "Success", description: "Availability block removed." });
            fetchEvents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove block", variant: "destructive" });
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Schedule</CardTitle>
                    <CardDescription>Manage your availability and view bookings</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEvents}>
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="calendar-container">
                        <style>{`
                    .fc-event { cursor: pointer; }
                    .fc-toolbar-title { font-size: 1.25rem !important; }
                    .fc-button { background-color: #f97316 !important; border-color: #f97316 !important; }
                    .fc-button:hover { background-color: #ea580c !important; border-color: #ea580c !important; }
                `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events} // Pass events here
                            selectable={true}
                            selectMirror={true}
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            height="auto"
                            slotMinTime="06:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={false}
                        />
                    </div>
                )}
            </CardContent>

            {/* Block Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Unavailable</DialogTitle>
                        <DialogDescription>
                            Block off this time slot on your calendar?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Input
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="e.g., Personal Time, Lunch"
                            />
                        </div>
                        {selectedDate && (
                            <div className="text-sm text-muted-foreground">
                                {format(new Date(selectedDate.start), 'PP p')} - {format(new Date(selectedDate.end), 'p')}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateBlock}>Confirm Block</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
