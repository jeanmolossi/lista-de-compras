import React from 'react';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SnackbarProvider } from '../src/store/SnackbarProvider';
import { ChatSessionProvider } from '../src/store/ChatSessionProvider';
import { ShoppingListProvider } from '../src/store/ShoppingListProvider';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f6f6f6',
  },
};

export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <SnackbarProvider>
        <ChatSessionProvider>
          <ShoppingListProvider>
            <ThemeProvider value={navigationTheme}>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: '#f6f6f6' },
                }}
              >
                <Stack.Screen name="index" options={{ title: 'Lista de Compras' }} />
                <Stack.Screen name="chat" options={{ title: 'Assistente IA' }} />
                <Stack.Screen name="categories" options={{ title: 'Categorias' }} />
                <Stack.Screen name="history" options={{ title: 'Histórico de Listas' }} />
              </Stack>
              <StatusBar style="dark" />
            </ThemeProvider>
          </ShoppingListProvider>
        </ChatSessionProvider>
      </SnackbarProvider>
    </SafeAreaProvider>
  );
}
