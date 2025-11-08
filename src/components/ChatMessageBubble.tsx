import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../store/ChatSessionProvider';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

const ChatMessageBubble = ({ message }: ChatMessageBubbleProps): JSX.Element => {
  const isUser = message.sender === 'user';
  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#1f7a8c',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#e0f2f1',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#102a43',
  },
});

export default ChatMessageBubble;
