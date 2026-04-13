export type StageInfo = { label: string; emoji: string; words: string[] };

export const STAGES: Record<number, StageInfo> = {
  1: {
    label: '음식',
    emoji: '🍕',
    words: [
      'Apple', 'Banana', 'Pizza', 'Cookie', 'Milk', 'Bread',
      'Rice', 'Cake', 'Soup', 'Egg', 'Corn', 'Jam',
      'Tea', 'Juice', 'Meat', 'Bean', 'Fish', 'Taco',
    ],
  },
  2: {
    label: '동물',
    emoji: '🐾',
    words: [
      'Dog', 'Cat', 'Bird', 'Bear', 'Lion', 'Wolf',
      'Deer', 'Frog', 'Duck', 'Cow', 'Pig', 'Hen',
      'Fox', 'Horse', 'Snake', 'Rabbit', 'Tiger', 'Shark',
    ],
  },
  3: {
    label: '탈것',
    emoji: '🚗',
    words: [
      'Car', 'Bus', 'Train', 'Plane', 'Boat', 'Ship',
      'Bike', 'Truck', 'Taxi', 'Rocket', 'Tram', 'Van',
      'Jet', 'Subway', 'Ferry', 'Yacht', 'Scooter', 'Chopper',
    ],
  },
  4: {
    label: '색깔',
    emoji: '🎨',
    words: [
      'Red', 'Blue', 'Green', 'Black', 'White', 'Pink',
      'Brown', 'Gray', 'Orange', 'Purple', 'Yellow', 'Gold',
      'Silver', 'Indigo', 'Violet', 'Teal', 'Cyan', 'Maroon',
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
