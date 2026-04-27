import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import StageSelectScreen from './src/screens/StageSelectScreen';
import GameScreen from './src/screens/GameScreen';
import StageClearScreen from './src/screens/StageClearScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import { SettingsProvider } from './src/context/SettingsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Home: undefined;
  CharacterSelect: undefined;
  StageSelect: undefined;
  Game: { stage: number };
  StageClear: { stage: number; score: number };
  GameOver: { stage: number; score: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // 폰트 추가
  const [fontsLoaded] = useFonts({
    'pre-b': require('./fonts/Pretendard-Bold.otf'),
    'pre-sb': require('./fonts/Pretendard-SemiBold.otf'),
    'pre-black': require('./fonts/Pretendard-Black.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
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
            <Stack.Screen name="CharacterSelect" component={CharacterSelectScreen} />
            <Stack.Screen name="StageSelect" component={StageSelectScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="StageClear" component={StageClearScreen} />
            <Stack.Screen name="GameOver" component={GameOverScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
