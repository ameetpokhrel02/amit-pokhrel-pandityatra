import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import panditLogo from '@/assets/images/PanditYatralogo.png';

interface UnifiedChatWidgetProps {
  bookingId?: string;
  panditName?: string;
}

const UnifiedChatWidget: React.FC<UnifiedChatWidgetProps> = ({ bookingId, panditName }) => {
  const { token, user } = useAuth();
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

  // Connect WebSocket when component mounts and bookingId is present
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!token || !user) {
    return null;
  }

  const getModeLabel = () => {
    if (mode === 'guide') {
      return 'PanditYatra AI Guide';
    }
    return `Chat with ${panditName || 'Pandit'}`;
  };

  const getWelcomeMessage = () => {
    if (mode === 'guide') {
      return "Namaste! I'm PanditYatra's AI helper. Ask me how to use the app or get help with bookings.";
    }
    return `You're now connected to ${panditName || 'the pandit'}. Feel free to ask any questions about your puja.`;
  };

  return (
    <>
      {/* Floating Button - Side positioned */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        title="Open chat"
        aria-label="Toggle chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Dialog - Side Drawer Style */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            "flex flex-col p-0 border-0 rounded-2xl shadow-2xl bg-white",
            "fixed bottom-0 right-0 top-0",
            "sm:bottom-6 sm:right-6 sm:top-auto",
            "sm:h-[600px] sm:max-w-md sm:rounded-2xl",
            "w-full sm:w-full max-w-md",
            "rounded-none sm:rounded-2xl",
            "max-h-[100vh] sm:max-h-[600px]",
            "z-50"
          )}
        >
          {/* Header */}
          <DialogHeader className="border-b border-gray-200 px-4 py-3 sm:py-4 space-y-0 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  {getModeLabel()}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm mt-1">
                  {mode === 'guide' 
                    ? 'Ask questions about PanditYatra services' 
                    : 'Real-time communication with your pandit'}
                </DialogDescription>
                {mode === 'interaction' && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-gray-400'
                      )}
                    />
                    <span className="text-xs text-gray-500">
                      {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                )}
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3 sm:space-y-4 px-2">
                  <img 
                    src={panditLogo} 
                    alt="PanditYatra Logo" 
                    className="w-16 sm:w-24 h-16 sm:h-24 mx-auto rounded-full shadow-lg border-4 border-orange-100"
                  />
                  <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed">{getWelcomeMessage()}</p>
                  {mode === 'guide' && (
                    <div className="text-xs text-orange-600 font-semibold">
                      🙏 Namaste! How can I help?
                    </div>
                  )}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={cn(
                  'flex gap-2 animate-fade-in',
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm break-words',
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  )}
                >
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 sm:px-4 py-2 rounded-lg rounded-bl-none">
                  <Loader className="animate-spin" size={16} />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm mx-1">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3 shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  mode === 'guide'
                    ? "Ask me anything..."
                    : "Type your message..."
                }
                disabled={isLoading || (mode === 'interaction' && !isConnected)}
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  isLoading ||
                  !inputValue.trim() ||
                  (mode === 'interaction' && !isConnected)
                }
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 sm:h-10 px-2 sm:px-3"
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default UnifiedChatWidget;
