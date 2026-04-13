import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'unlocked_stages';

export async function getUnlockedStages(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [1];
  } catch {
    return [1];
  }
}

export async function unlockStage(stage: number): Promise<void> {
  try {
    const current = await getUnlockedStages();
    if (!current.includes(stage)) {
      await AsyncStorage.setItem(KEY, JSON.stringify([...current, stage]));
    }
  } catch {}
}

export async function resetUnlocks(): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify([1]));
}
