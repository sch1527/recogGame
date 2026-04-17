export type StageInfo = { label: string; emoji: string; words: string[] };

export const STAGES: Record<number, StageInfo> = {
  1: {
    label: '음식',
    emoji: '🍕',
    words: [
      'Apple', 'Banana', 'Pizza', 'Cookie', 'Milk', 'Jelly',
    ],
  },
  2: {
    label: '동물',
    emoji: '🐾',
    words: [
      'Lion', 'Tiger', 'Monkey', 'Zebra', 'Hippo', 'Snake',
    ],
  },
  3: {
    label: '탈것',
    emoji: '🚗',
    words: [
      'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Boat',
    ],
  },
  4: {
    label: '색깔',
    emoji: '🎨',
    words: [
      'Red', 'Blue', 'Yellow', 'Green', 'Pink', 'White',
    ],
  },
};

export const STAGE_COUNT = Object.keys(STAGES).length;

export function getStageInfo(stage: number): StageInfo {
  const clamped = Math.min(Math.max(stage, 1), STAGE_COUNT);
  return STAGES[clamped];
}

export function getWordPool(stage: number): string[] {
  return getStageInfo(stage).words;
}

export function getRandomWord(stage: number, exclude: string[] = []): string {
  const pool = getWordPool(stage).filter(w => !exclude.includes(w));
  if (pool.length === 0) return getWordPool(stage)[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
