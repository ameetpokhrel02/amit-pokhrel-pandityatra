import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import panditLogo from '@/assets/images/PanditYatralogo.png';

import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedChatWidgetProps {
  bookingId?: string;
  panditName?: string;
}

const UnifiedChatWidget: React.FC<UnifiedChatWidgetProps> = ({ bookingId, panditName }) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    mode,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
  } = useChat(bookingId);

  useEffect(() => {
    if (isOpen && bookingId && token && mode === 'interaction') {
      connectWebSocket(bookingId, token);
    }
    return () => {
      if (mode === 'interaction') {
        disconnectWebSocket();
      }
    };
  }, [isOpen, bookingId, token, mode, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [showPopup, setShowPopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasInteracted && !isOpen && window.scrollY > 300) {
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasInteracted, isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    setHasInteracted(true);
    setShowPopup(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModeLabel = () => {
    if (bookingId) return `Chat with ${panditName || 'Pandit'}`;
    return 'PanditYatra AI Guide';
  };

  const getWelcomeMessage = () => {
    if (bookingId) {
      return `You're now connected to ${panditName || 'the pandit'}. Feel free to ask any questions about your puja.`;
    }
    return "Namaste! I'm PanditYatra's AI helper. I can help you book pujas, find pandits, or explain app features.";
  };

  return (
    <>
      {/* Floating Trigger */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white border-2 border-orange-100 shadow-xl rounded-2xl rounded-br-none p-4 max-w-[220px] mb-2 relative"
            >
              <p className="text-sm text-orange-900 font-medium leading-tight">
                🙏 Namaste! Need guidance for your spiritual journey?
              </p>
              <button
                onClick={() => setHasInteracted(true)}
                className="absolute -top-2 -left-2 bg-orange-100 text-orange-600 rounded-full p-1 hover:bg-orange-200 transition-colors"
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleOpen}
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 p-0 overflow-hidden border-4 border-white",
            isOpen ? "bg-red-500" : "bg-gradient-to-br from-orange-500 to-amber-600"
          )}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={32} />}
          {!isOpen && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
            </span>
          )}
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[400px] p-0 flex flex-col border-l-2 border-orange-100 overflow-hidden bg-white"
        >
          {/* Custom Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white shrink-0 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <img src={panditLogo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-white text-xl font-bold tracking-tight">
                  {getModeLabel()}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-orange-200")} />
                  <span className="text-[10px] text-orange-50 font-medium uppercase tracking-widest">
                    {isConnected ? 'Live & Connected' : 'Spiritual System Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-orange-50/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot size={48} className="text-orange-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-orange-900 font-bold text-lg">Vedic AI Assistant</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {getWelcomeMessage()}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {['Book a Puja', 'Find Pandit', 'Pooja Items'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setInputValue(tag)}
                      className="px-3 py-1.5 rounded-full bg-white border border-orange-200 text-xs text-orange-700 hover:bg-orange-50 transition-colors shadow-sm"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={cn("flex gap-3", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  msg.sender === 'user' ? "bg-orange-500 text-white" : "bg-white border-2 border-orange-200 text-orange-600"
                )}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "max-w-[75%] space-y-1",
                  msg.sender === 'user' ? "items-end text-right" : "items-start text-left"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm shadow-md transition-all",
                    msg.sender === 'user'
                      ? "bg-orange-500 text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border-l-4 border-orange-500"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-orange-100 flex items-center justify-center animate-pulse">
                  <Bot size={16} className="text-orange-300" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-orange-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-medium text-center shadow-sm mx-4">
                <Sparkles className="inline-block mr-2 text-red-400" size={14} />
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-2 border-orange-50 bg-white shrink-0">
            <div className="relative group">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="pr-12 py-6 rounded-2xl border-orange-100 focus:border-orange-500 focus:ring-orange-200 bg-orange-50/30 text-sm transition-all"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all p-0"
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">
              Powered by PanditYatra Divine AI
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default UnifiedChatWidget;
