import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import ChatMessageBubble from '../components/ChatMessageBubble';
import { useShoppingList } from '../store/ShoppingListProvider';
import {
  generateShoppingListFromConversation,
  getAssistantReply,
} from '../services/ai/shoppingListGenerator';
import { useChatSession, ChatMessage } from '../store/ChatSessionProvider';
import { useSnackbar } from '../store/SnackbarProvider';

const INPUT_VERTICAL_PADDING = 16;

const ChatScreen = (): JSX.Element => {
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { createListFromSuggestion } = useShoppingList();
  const { messages, addMessage, resetSession, hydrated } = useChatSession();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const isGenerateCommand = useCallback((text: string) => {
    const normalized = text.toLowerCase();

    const matchesVerbBeforeList =
      /\b(ger[ea]|crie|criar|cria|monte|montar|gera|gere|gerar)\b.*\blista\b/.test(
        normalized,
      );
    const matchesListBeforeVerb =
      /\blista\b.*\b(ger[ea]|crie|criar|cria|monte|montar|gera|gere|gerar)\b/.test(
        normalized,
      );

    return matchesVerbBeforeList || matchesListBeforeVerb;
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !hydrated) {
      return;
    }
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      text: trimmed,
      sender: 'user',
    };
    const nextConversation = [...messages, userMessage];
    addMessage(userMessage);
    setInput('');
    scrollToBottom();
    setLoading(true);

    try {
      if (isGenerateCommand(trimmed)) {
        const suggestion = await generateShoppingListFromConversation(nextConversation);
        await createListFromSuggestion(suggestion);
        addMessage({
          id: `${Date.now()}-assistant`,
          sender: 'assistant',
          text: `Lista "${suggestion.name}" criada com ${suggestion.categories.length} categorias. Confira os detalhes na tela inicial!`,
        });
        showSnackbar('Lista de compras gerada com sucesso!', 'info');
      } else {
        const reply = await getAssistantReply(nextConversation);
        addMessage({
          id: `${Date.now()}-assistant`,
          sender: 'assistant',
          text: reply,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a lista no momento.';
      showSnackbar(message, 'error');
      addMessage({
        id: `${Date.now()}-error`,
        sender: 'assistant',
        text: 'Encontrei um problema. Tente novamente em instantes.',
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleStartNewChat = () => {
    if (loading) {
      return;
    }
    resetSession().catch(() => undefined);
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f7a8c" />
        <Text style={styles.loadingText}>Carregando conversa...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: headerHeight, android: 0 })}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatMessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={handleStartNewChat}
                disabled={loading}
              >
                <Text style={styles.newChatButtonText}>Iniciar novo chat</Text>
              </TouchableOpacity>
            </View>
          }
        />
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                INPUT_VERTICAL_PADDING + (isKeyboardVisible ? 0 : insets.bottom),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Ex.: Lista para churrasco com 6 pessoas"
            value={input}
            onChangeText={setInput}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  headerActions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  newChatButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f7a8c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: INPUT_VERTICAL_PADDING,
    paddingBottom: INPUT_VERTICAL_PADDING,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d9e2ec',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#1f7a8c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#486581',
  },
});

export default ChatScreen;
