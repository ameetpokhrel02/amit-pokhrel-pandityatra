import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ChatContextType {
  // State for triggering pandit chat
  pendingPanditChat: { panditId: string; panditName: string; panditProfilePic?: string } | null;
  // Function to request opening chat with a pandit
  openChatWithPandit: (panditId: string, panditName: string, panditProfilePic?: string) => void;
  // Function to clear the pending request (called by widget after processing)
  clearPendingChat: () => void;
  // Flag to open AI guide
  shouldOpenAIGuide: boolean;
  openAIGuide: () => void;
  clearAIGuide: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingPanditChat, setPendingPanditChat] = useState<{ panditId: string; panditName: string; panditProfilePic?: string } | null>(null);
  const [shouldOpenAIGuide, setShouldOpenAIGuide] = useState(false);

  const openChatWithPandit = useCallback((panditId: string, panditName: string, panditProfilePic?: string) => {
    setPendingPanditChat({ panditId, panditName, panditProfilePic });
  }, []);

  const clearPendingChat = useCallback(() => {
    setPendingPanditChat(null);
  }, []);

  const openAIGuide = useCallback(() => {
    setShouldOpenAIGuide(true);
  }, []);

  const clearAIGuide = useCallback(() => {
    setShouldOpenAIGuide(false);
  }, []);

  return (
    <ChatContext.Provider value={{
      pendingPanditChat,
      openChatWithPandit,
      clearPendingChat,
      shouldOpenAIGuide,
      openAIGuide,
      clearAIGuide,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatTrigger = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatTrigger must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
