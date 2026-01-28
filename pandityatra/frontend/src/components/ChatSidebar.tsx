import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, MessageCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ChatSidebarProps {
    bookingId: string;
    panditName?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ bookingId, panditName }) => {
    const { user, token } = useAuth();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        isLoading,
        sendMessage,
        connectWebSocket,
        disconnectWebSocket,
        isConnected,
    } = useChat(bookingId);

    useEffect(() => {
        if (bookingId && token) {
            connectWebSocket(bookingId, token);
        }
        return () => disconnectWebSocket();
    }, [bookingId, token, connectWebSocket, disconnectWebSocket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const msg = inputValue;
        setInputValue('');
        await sendMessage(msg);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-orange-50/50 flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-bold text-orange-900">Pushpa Chat</h3>
                    <p className="text-[10px] text-gray-500">Real-time with {panditName || 'Pandit'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={isConnected ? "default" : "secondary"} className={cn(
                        "text-[10px] px-2 py-0",
                        isConnected ? "bg-green-500 hover:bg-green-500" : "bg-gray-400"
                    )}>
                        {isConnected ? 'LIVE' : 'RECONNECTING'}
                    </Badge>
                    <button
                        className="ml-2 text-xs text-orange-700 underline hover:text-orange-900 transition-colors"
                        title="Export Chat Log"
                        onClick={() => {
                            if (!messages.length) return;
                            const log = messages.map(m => {
                                const who = m.sender === 'user' ? 'You' : (m.sender === 'pandit' ? (panditName || 'Pandit') : 'AI');
                                return `[${new Date(m.timestamp).toLocaleString()}] ${who}: ${m.content}`;
                            }).join('\n');
                            const blob = new Blob([log], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `chatlog-booking-${bookingId}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }, 100);
                        }}
                        disabled={!messages.length}
                    >
                        Export Chat
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-orange-300" />
                            <p className="text-xs">No messages yet.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex flex-col",
                                msg.sender === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "max-w-[85%] p-3 rounded-2xl text-xs shadow-sm",
                                    msg.sender === 'user'
                                        ? "bg-orange-600 text-white rounded-tr-none"
                                        : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[9px] text-gray-400 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50">
                <div className="relative">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="w-full bg-white border border-gray-200 rounded-full pl-4 pr-12 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading || !isConnected}
                        className="absolute right-1 top-1 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 disabled:bg-gray-300 transition-colors shadow-sm"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
