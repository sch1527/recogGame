import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import StageSelectScreen from './src/screens/StageSelectScreen';
import GameScreen from './src/screens/GameScreen';
import StageClearScreen from './src/screens/StageClearScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import { SettingsProvider } from './src/context/SettingsContext';

export type RootStackParamList = {
  Home: undefined;
  StageSelect: undefined;
  Game: { stage: number };
  StageClear: { stage: number; score: number };
  GameOver: { stage: number; score: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SettingsProvider>
    <NavigationContainer>
      <StatusBar style="light" hidden={true} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0a2e' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StageSelect" component={StageSelectScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="StageClear" component={StageClearScreen} />
        <Stack.Screen name="GameOver" component={GameOverScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </SettingsProvider>
  );
}
