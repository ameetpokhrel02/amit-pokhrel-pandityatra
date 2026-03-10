import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Shield, X, Send, Loader, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import panditLogo from '@/assets/images/PanditYatralogo.png';
import { ChatProductCard } from './ChatProductCard';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedChatWidgetProps {
  bookingId?: string;
  panditName?: string;
}

const UnifiedChatWidget: React.FC<UnifiedChatWidgetProps> = ({ bookingId, panditName }) => {
  const { token, role } = useAuth();
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
    bookingId: activeBookingId,
    switchMode,
  } = useChat(bookingId);

  useEffect(() => {
    if (isOpen && activeBookingId && token && mode === 'interaction') {
      connectWebSocket(activeBookingId, token);
    }
    return () => {
      if (mode === 'interaction') {
        disconnectWebSocket();
      }
    };
  }, [isOpen, activeBookingId, token, mode, connectWebSocket, disconnectWebSocket]);

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
    if (mode === 'interaction') return `Chat with ${panditName || 'Pandit'}`;
    return 'PanditYatra AI Guide';
  };

  const getWelcomeMessage = () => {
    if (bookingId) {
      return `You're now connected to ${panditName || 'the pandit'}. Feel free to ask any questions about your puja.`;
    }
    return "Namaste! I'm PanditYatra's AI helper. I can help you book pujas, find pandits, or explain app features.";
  };

  // 🛡️ Guard: Only show for customers (users) or guests. Hide for Pandits and Admins.
  if (role === 'pandit' || role === 'admin') {
    return null;
  }

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

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              onClick={handleOpen}
              className={cn(
                "w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-105 active:scale-95 p-0 overflow-visible relative text-white border-none shrink-0",
                isOpen ? "bg-orange-600" : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              <AnimatePresence mode='wait'>
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                  >
                    <X size={26} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="msg"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <MessageSquare size={26} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
              {!isOpen && (
                <span className="absolute -top-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white border-2 border-white shadow-sm z-10">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[92vw] sm:w-[380px] p-0 mb-4 mr-0 sm:mr-6 rounded-3xl overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white animate-in zoom-in-95 duration-200"
            side="top"
            align="end"
            sideOffset={16}
          >
            <div className="flex flex-col h-[550px] max-h-[80vh]">
              {/* Custom Header */}
              <div className="bg-orange-600 p-5 text-white shrink-0 shadow-md relative">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="absolute top-5 right-4 text-white/80 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3.5 pr-8">
                  <div className="w-[45px] h-[45px] rounded-full bg-white flex items-center justify-center border border-white/20 shrink-0 overflow-hidden shadow-inner p-1">
                    <img src={panditLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-[17px] font-bold tracking-tight leading-snug truncate m-0 p-0">
                      {getModeLabel()}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-[#a3e635]")} />
                      <span className="text-[13px] text-white/90 font-medium">
                        Online — {isConnected ? 'Live Chat' : 'PanditYatra AI Support'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-orange-50/10 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center shadow-inner">
                      <Bot size={40} className="text-orange-600" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-900 font-bold text-lg leading-tight">Namaste! How can I help?</h4>
                      <p className="text-gray-600 text-[13px] leading-relaxed">
                        {getWelcomeMessage()}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {['Book a Puja', 'Order Agarbatti', 'Panchang Today'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setInputValue(tag)}
                          className="px-3.5 py-2 rounded-full bg-white border border-orange-100 text-[12px] font-medium text-orange-700 hover:bg-orange-50 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg: any, idx: number) => (
                  <div key={msg.id || idx} className={cn("flex flex-col gap-1 w-full", msg.sender === 'user' ? "items-end text-right" : "items-start text-left")}>
                    <div className={cn("flex gap-2.5", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                        msg.sender === 'user' ? "bg-orange-500 text-white" : "bg-white border border-orange-100 text-orange-600"
                      )}>
                        {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                      </div>
                      <div className={cn(
                        "max-w-[82%] space-y-1",
                        msg.sender === 'user' ? "items-end text-right" : "items-start text-left"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[13.5px] shadow-sm transition-all whitespace-pre-wrap leading-relaxed",
                          msg.sender === 'user'
                            ? "bg-orange-500 text-white rounded-tr-none"
                            : "bg-white text-gray-800 rounded-tl-none border-l-4 border-orange-500"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    </div>

                    {msg.products && msg.products.length > 0 && (
                      <div className={cn("flex flex-col gap-2 w-full", msg.sender === 'user' ? "items-end pr-10" : "items-start pl-10")}>
                        {msg.products.map((product: any) => (
                          <ChatProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                    
                    {msg.actions && msg.actions.map((action: any, aIdx: number) => (
                      action.type === 'SWITCH_MODE' && (
                        <div key={aIdx} className="ml-10 mt-2">
                          <Button 
                            onClick={() => switchMode(action.bookingId!, action.panditName)}
                            variant="outline"
                            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 rounded-xl text-xs flex gap-2 items-center py-1 h-auto"
                          >
                            <MessageSquare size={14} />
                            Switch to Chat with {action.panditName || 'Pandit'}
                          </Button>
                        </div>
                      )
                    ))}
                    
                    <span className={cn("text-[10px] text-gray-400 font-medium px-1 mt-0.5", msg.sender === 'user' ? "mr-10" : "ml-10")}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center">
                    <div className="w-8 h-8 rounded-full bg-white border border-orange-50 flex items-center justify-center animate-pulse">
                      <Bot size={15} className="text-orange-300" />
                    </div>
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none border border-orange-50 flex gap-1 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-2xl text-[12px] font-medium text-center shadow-sm mx-4">
                    <Sparkles className="inline-block mr-2 text-red-300" size={14} />
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-orange-50 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="relative group flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about rituals or products..."
                      className="pr-10 py-5 rounded-2xl border-orange-100 focus:border-orange-500 focus:ring-0 bg-orange-50/30 text-[13px] transition-all placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/10 transition-all p-0"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-center text-[9px] text-gray-400 mt-2.5 font-bold uppercase tracking-widest opacity-60">
                  Powered by PanditYatra Divine AI
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default UnifiedChatWidget;
