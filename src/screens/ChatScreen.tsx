import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ChatMessageBubble from '../components/ChatMessageBubble';
import { useShoppingList } from '../store/ShoppingListProvider';
import { generateShoppingList } from '../services/ai/shoppingListGenerator';

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
};

const ChatScreen = (): JSX.Element => {
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const { createListFromSuggestion } = useShoppingList();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Descreva suas necessidades e criarei uma lista de compras personalizada.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      text: trimmed,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    scrollToBottom();
    setLoading(true);

    try {
      const suggestion = await generateShoppingList(trimmed);
      await createListFromSuggestion(suggestion);
      const summary = `Criei a lista "${suggestion.name}" com ${suggestion.categories.length} categorias. Confira os detalhes na tela inicial!`;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          sender: 'assistant',
          text: summary,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a lista no momento.';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          sender: 'assistant',
          text: `Erro: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageBubble message={item} />}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.inputContainer}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  listContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
});

export default ChatScreen;
