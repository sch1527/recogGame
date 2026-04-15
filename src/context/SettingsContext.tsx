import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface SettingsState {
  volume: number;       // 0, 25, 50, 75, 100
  difficulty: Difficulty;
}

interface SettingsContextValue extends SettingsState {
  setVolume: (v: number) => void;
  setDifficulty: (d: Difficulty) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  volume: 75,
  difficulty: 'normal',
  setVolume: () => {},
  setDifficulty: () => {},
});

const STORAGE_KEY = '@recogGame_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState(75);
  const [difficulty, setDifficultyState] = useState<Difficulty>('normal');

  // refs to always have latest values in save function
  const volRef = useRef(75);
  const diffRef = useRef<Difficulty>('normal');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as Partial<SettingsState>;
        if (typeof s.volume === 'number') {
          setVolumeState(s.volume);
          volRef.current = s.volume;
        }
        if (s.difficulty) {
          setDifficultyState(s.difficulty);
          diffRef.current = s.difficulty;
        }
      } catch {}
    });
  }, []);

  const setVolume = (v: number) => {
    volRef.current = v;
    setVolumeState(v);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: v, difficulty: diffRef.current }));
  };

  const setDifficulty = (d: Difficulty) => {
    diffRef.current = d;
    setDifficultyState(d);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: volRef.current, difficulty: d }));
  };

  return (
    <SettingsContext.Provider value={{ volume, difficulty, setVolume, setDifficulty }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
