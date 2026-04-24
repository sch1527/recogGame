import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CHARACTER_ID } from '../data/characters';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface SettingsState {
  bgmVolume: number;
  sfxVolume: number;
  difficulty: Difficulty;
  characterId: string;
}

interface SettingsContextValue extends SettingsState {
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setDifficulty: (d: Difficulty) => void;
  setCharacterId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  bgmVolume: 75,
  sfxVolume: 75,
  difficulty: 'normal',
  characterId: DEFAULT_CHARACTER_ID,
  setBgmVolume: () => {},
  setSfxVolume: () => {},
  setDifficulty: () => {},
  setCharacterId: () => {},
});

const STORAGE_KEY = '@recogGame_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bgmVolume, setBgmState] = useState(75);
  const [sfxVolume, setSfxState] = useState(75);
  const [difficulty, setDifficultyState] = useState<Difficulty>('normal');
  const [characterId, setCharacterState] = useState(DEFAULT_CHARACTER_ID);

  const bgmRef = useRef(75);
  const sfxRef = useRef(75);
  const diffRef = useRef<Difficulty>('normal');
  const charRef = useRef(DEFAULT_CHARACTER_ID);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as Partial<SettingsState & { volume?: number }>;
        const legacy = typeof s.volume === 'number' ? s.volume : undefined;
        const bgm = typeof s.bgmVolume === 'number' ? s.bgmVolume : legacy ?? 75;
        const sfx = typeof s.sfxVolume === 'number' ? s.sfxVolume : legacy ?? 75;
        setBgmState(bgm); bgmRef.current = bgm;
        setSfxState(sfx); sfxRef.current = sfx;
        if (s.difficulty) { setDifficultyState(s.difficulty); diffRef.current = s.difficulty; }
        if (s.characterId) { setCharacterState(s.characterId); charRef.current = s.characterId; }
      } catch {}
    });
  }, []);

  const save = () =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      bgmVolume: bgmRef.current,
      sfxVolume: sfxRef.current,
      difficulty: diffRef.current,
      characterId: charRef.current,
    }));

  const setBgmVolume = (v: number) => { bgmRef.current = v; setBgmState(v); save(); };
  const setSfxVolume = (v: number) => { sfxRef.current = v; setSfxState(v); save(); };
  const setDifficulty = (d: Difficulty) => { diffRef.current = d; setDifficultyState(d); save(); };
  const setCharacterId = (id: string) => { charRef.current = id; setCharacterState(id); save(); };

  return (
    <SettingsContext.Provider value={{
      bgmVolume, sfxVolume, difficulty, characterId,
      setBgmVolume, setSfxVolume, setDifficulty, setCharacterId,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
