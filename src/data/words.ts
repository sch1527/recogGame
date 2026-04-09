export const ENGLISH_WORDS = {
  easy: [
    'Apple', 'Banana', 'Pizza', 'Cookie', 'Milk', 'Jelly',
    'run', 'eat', 'fly', 'hot', 'cold', 'old', 'new', 'day',
    'night', 'tree', 'bird', 'fish', 'rain', 'snow', 'wind', 'fire',
    'hand', 'face', 'eyes', 'nose', 'mouth', 'star', 'moon', 'book',
  ],
  medium: [
    'apple', 'grape', 'bread', 'water', 'table', 'chair', 'phone',
    'house', 'clock', 'music', 'movie', 'sport', 'dance', 'smile',
    'happy', 'angry', 'brave', 'smart', 'funny', 'quiet',
    'green', 'black', 'white', 'brown', 'orange', 'purple',
    'cloud', 'river', 'ocean', 'desert', 'forest', 'garden',
  ],
  hard: [
    'adventure', 'beautiful', 'chocolate', 'dangerous', 'education',
    'fantastic', 'grateful', 'hospital', 'important', 'knowledge',
    'language', 'mountain', 'notebook', 'opposite', 'possible',
    'question', 'remember', 'shoulder', 'together', 'umbrella',
    'vacation', 'wonderful', 'yesterday', 'computer', 'keyboard',
  ],
};

export function getWordPool(level: number): string[] {
  if (level <= 2) return ENGLISH_WORDS.easy;
  if (level <= 4) return [...ENGLISH_WORDS.easy, ...ENGLISH_WORDS.medium];
  return [...ENGLISH_WORDS.easy, ...ENGLISH_WORDS.medium, ...ENGLISH_WORDS.hard];
}

export function getRandomWord(level: number, exclude: string[] = []): string {
  const pool = getWordPool(level).filter(w => !exclude.includes(w));
  return pool[Math.floor(Math.random() * pool.length)];
}
