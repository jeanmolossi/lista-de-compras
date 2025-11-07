import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import ListHistoryScreen from '../screens/ListHistoryScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  CategoryManagement: undefined;
  ListHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): JSX.Element => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Lista de Compras' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ title: 'Assistente IA' }}
    />
    <Stack.Screen
      name="CategoryManagement"
      component={CategoryManagementScreen}
      options={{ title: 'Categorias' }}
    />
    <Stack.Screen
      name="ListHistory"
      component={ListHistoryScreen}
      options={{ title: 'Histórico de Listas' }}
    />
  </Stack.Navigator>
);

export default RootNavigator;
