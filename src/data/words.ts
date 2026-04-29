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

// STT가 자주 오인식하는 패턴을 직접 등록 (소문자)
// 퍼지 매칭(50% Levenshtein)으로 커버되지 않는 경우에만 추가
export const WORD_ALIASES: Record<string, string[]> = {
  // lion(4글자, 임계값=2): lying은 거리=3으로 퍼지 매칭 미통과
  'lion': ['lying', 'lyin'],
  // 실제 플레이 중 오인식 패턴을 발견할 때마다 추가
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
