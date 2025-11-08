import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ChatActor = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  sender: ChatActor;
  text: string;
};

type ChatSessionContextValue = {
  messages: ChatMessage[];
  hydrated: boolean;
  addMessage: (message: ChatMessage) => void;
  addMessages: (messages: ChatMessage[]) => void;
  resetSession: () => Promise<void>;
};

const STORAGE_KEY = '@shopping_list_ai_chat_session';

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: 'Olá! Conte-me sobre a ocasião e suas preferências para montarmos a melhor lista de compras.',
  },
];

const ChatSessionContext = createContext<ChatSessionContextValue | undefined>(undefined);

const ChatSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
        setMessages(DEFAULT_MESSAGES);
      } catch (error) {
        console.error('Erro ao carregar sessão do chat', error);
        setMessages(DEFAULT_MESSAGES);
      } finally {
        setHydrated(true);
      }
    };

    loadMessages().catch((error) => {
      console.error('Erro inesperado ao carregar sessão do chat', error);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch((error) => {
      console.error('Erro ao persistir sessão do chat', error);
    });
  }, [hydrated, messages]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addMessages = useCallback((list: ChatMessage[]) => {
    if (!list.length) {
      return;
    }
    setMessages((prev) => [...prev, ...list]);
  }, []);

  const resetSession = useCallback(async () => {
    setMessages(DEFAULT_MESSAGES);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
    } catch (error) {
      console.error('Erro ao redefinir sessão do chat', error);
    }
  }, []);

  const value = useMemo<ChatSessionContextValue>(
    () => ({
      messages,
      hydrated,
      addMessage,
      addMessages,
      resetSession,
    }),
    [addMessage, addMessages, hydrated, messages, resetSession],
  );

  return (
    <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>
  );
};

export const useChatSession = (): ChatSessionContextValue => {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error('useChatSession deve ser usado dentro de ChatSessionProvider');
  }
  return context;
};

export { ChatSessionProvider };
