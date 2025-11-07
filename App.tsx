import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/app/RootNavigator';
import { ShoppingListProvider } from './src/store/ShoppingListProvider';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f6f6f6',
  },
};

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <ShoppingListProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </ShoppingListProvider>
    </SafeAreaProvider>
  );
}
