import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import logo from '@/assets/images/PanditYatralogo.png';

interface Message {
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

const AIGuideBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content: "Namaste! I am your PanditYatra AI Guide. How can I help you on your spiritual journey today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiClient.post('/services/ai-guide/', {
                prompt: input
            });

            const botMsg: Message = {
                role: 'bot',
                content: response.data.response || response.data.reply || "I'm here to help with your spiritual needs.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("AI Guide Error:", error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "I'm having a little trouble connecting to the heavens right now. Please try again in a moment. 🙏",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px] max-h-[500px] shadow-2xl rounded-3xl overflow-hidden border border-orange-100 bg-white"
                    >
                        <Card className="border-none shadow-none h-full flex flex-col">
                            <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                            <img src={logo} alt="Bot" className="w-6 h-6 object-contain invert brightness-0" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">AI Guide Bot</CardTitle>
                                            <p className="text-[10px] text-orange-100 opacity-80 uppercase tracking-widest">Always Active</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="text-white hover:bg-white/20 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[350px]" ref={scrollRef}>
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                    ? 'bg-orange-600 text-white rounded-tr-none shadow-lg shadow-orange-600/10'
                                                    : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <div className="p-4 border-t bg-gray-50/50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask about pujas, booking..."
                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/20"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="group relative"
                >
                    <div className="absolute inset-0 bg-orange-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                    <div className="relative bg-orange-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-1 border border-orange-200 border-dashed rounded-full"
                        />
                    </div>
                </motion.button>
            )}
        </div>
    );
};

export default AIGuideBot;
