import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Search, 
    MessageSquare, 
    Send, 
    MoreVertical, 
    Phone, 
    Info,
    CheckCheck,
    Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchVendorChats, fetchChatMessages, sendChatMessage, type ChatRoom } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function VendorMessages() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Load Rooms
    useEffect(() => {
        const loadRooms = async () => {
            try {
                const data = await fetchVendorChats();
                setRooms(data);
                if (data.length > 0 && !selectedRoom) {
                    setSelectedRoom(data[0]);
                }
            } catch (err) {
                toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" });
            } finally {
                setLoadingRooms(false);
            }
        };
        loadRooms();
    }, []);

    // 2. Load Messages when room changes
    useEffect(() => {
        if (!selectedRoom) return;
        
        const loadMessages = async () => {
            setLoadingMessages(true);
            try {
                const data = await fetchChatMessages(selectedRoom.id);
                setMessages(data);
            } catch (err) {
                toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
            } finally {
                setLoadingMessages(false);
            }
        };
        loadMessages();
        
        // Polling for new messages (fallback for WebSocket)
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedRoom]);

    // 3. Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom || sending) return;

        setSending(true);
        try {
            const data = await sendChatMessage(selectedRoom.id, newMessage);
            setMessages([...messages, data]);
            setNewMessage("");
        } catch (err) {
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    return (
        <DashboardLayout userRole="vendor">
            <div className="h-[calc(100vh-12rem)] flex gap-6">
                {/* Conversations List */}
                <div className="w-80 flex flex-col gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
                        <p className="text-sm text-muted-foreground">Chat with your customers</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search customers..." className="pl-10 h-11 bg-white border-none shadow-sm focus-visible:ring-orange-500" />
                    </div>

                    <Card className="flex-1 overflow-hidden border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-0 overflow-y-auto h-full">
                            {loadingRooms ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {rooms.map((room) => (
                                        <div 
                                            key={room.id}
                                            onClick={() => setSelectedRoom(room)}
                                            className={`
                                                p-4 cursor-pointer transition-colors flex items-center gap-4
                                                ${selectedRoom?.id === room.id ? 'bg-orange-50' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                    <AvatarImage src={room.customer.profile_pic} />
                                                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                                        {room.customer.full_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-gray-800 truncate">{room.customer.full_name}</h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                        {room.last_message_time ? new Date(room.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{room.last_message || 'No messages yet'}</p>
                                            </div>
                                            {room.unread_count > 0 && (
                                                <Badge className="bg-orange-500 hover:bg-orange-600 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                                    {room.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedRoom ? (
                        <>
                            {/* Chat Header */}
                            <Card className="mb-4 border-none shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarImage src={selectedRoom.customer.profile_pic} />
                                            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                                {selectedRoom.customer.full_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{selectedRoom.customer.full_name}</h3>
                                            <p className="text-[10px] text-green-600 flex items-center gap-1">
                                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Online
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                                            <Phone size={20} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                                            <Info size={20} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-gray-400">
                                            <MoreVertical size={20} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Chat Messages */}
                            <div 
                                className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl mb-4 p-6 overflow-y-auto flex flex-col gap-6"
                                ref={scrollRef}
                            >
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender === 'vendor';
                                        return (
                                            <div key={msg.id || idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                {!isMe && (
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={selectedRoom.customer.profile_pic} />
                                                        <AvatarFallback className="bg-orange-100 text-[10px] font-bold">
                                                            {selectedRoom.customer.full_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`
                                                    p-4 rounded-2xl shadow-sm max-w-[70%] border
                                                    ${isMe ? 'bg-orange-600 text-white border-orange-500 rounded-tr-none' : 'bg-white text-gray-700 border-gray-100 rounded-tl-none'}
                                                `}>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <div className={`flex items-center gap-1 mt-2 ${isMe ? 'justify-end' : ''}`}>
                                                        <span className={`text-[10px] ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        {isMe && <CheckCheck size={12} className="text-orange-200" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendMessage}>
                                <Card className="border-none shadow-lg bg-white rounded-3xl">
                                    <CardContent className="p-2 flex items-center gap-2">
                                        <Input 
                                            placeholder="Type your message..." 
                                            className="border-none focus-visible:ring-0 shadow-none h-12 text-gray-600 pl-4"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={sending}
                                        />
                                        <Button 
                                            type="submit"
                                            className="h-12 w-12 rounded-2xl bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                                            disabled={sending || !newMessage.trim()}
                                        >
                                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} className="text-white" />}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                            <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-12 w-12 text-orange-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-800">Your Conversations</h2>
                                <p className="text-muted-foreground">Select a chat to start messaging your customers.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
