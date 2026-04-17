import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface SettingsState {
  bgmVolume: number;    // 0~100
  sfxVolume: number;    // 0~100
  difficulty: Difficulty;
}

interface SettingsContextValue extends SettingsState {
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setDifficulty: (d: Difficulty) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  bgmVolume: 75,
  sfxVolume: 75,
  difficulty: 'normal',
  setBgmVolume: () => {},
  setSfxVolume: () => {},
  setDifficulty: () => {},
});

const STORAGE_KEY = '@recogGame_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bgmVolume, setBgmState] = useState(75);
  const [sfxVolume, setSfxState] = useState(75);
  const [difficulty, setDifficultyState] = useState<Difficulty>('normal');

  const bgmRef = useRef(75);
  const sfxRef = useRef(75);
  const diffRef = useRef<Difficulty>('normal');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as Partial<SettingsState & { volume?: number }>;
        // 이전 버전 volume 값 마이그레이션
        const legacy = typeof s.volume === 'number' ? s.volume : undefined;
        const bgm = typeof s.bgmVolume === 'number' ? s.bgmVolume : legacy ?? 75;
        const sfx = typeof s.sfxVolume === 'number' ? s.sfxVolume : legacy ?? 75;
        setBgmState(bgm); bgmRef.current = bgm;
        setSfxState(sfx); sfxRef.current = sfx;
        if (s.difficulty) { setDifficultyState(s.difficulty); diffRef.current = s.difficulty; }
      } catch {}
    });
  }, []);

  const save = () =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      bgmVolume: bgmRef.current,
      sfxVolume: sfxRef.current,
      difficulty: diffRef.current,
    }));

  const setBgmVolume = (v: number) => { bgmRef.current = v; setBgmState(v); save(); };
  const setSfxVolume = (v: number) => { sfxRef.current = v; setSfxState(v); save(); };
  const setDifficulty = (d: Difficulty) => { diffRef.current = d; setDifficultyState(d); save(); };

  return (
    <SettingsContext.Provider value={{ bgmVolume, sfxVolume, difficulty, setBgmVolume, setSfxVolume, setDifficulty }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
