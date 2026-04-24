import { Audio } from 'expo-av';

// sounds/ 폴더에 MP3 파일을 추가할 때 해당 줄의 주석을 해제하세요
const WORD_ASSETS: Record<string, any> = {
  apple:   require('../../sounds/apple.mp3'),
  // banana:  require('../../sounds/banana.mp3'),
  // pizza:   require('../../sounds/pizza.mp3'),
  // cookie:  require('../../sounds/cookie.mp3'),
  // milk:    require('../../sounds/milk.mp3'),
  // jelly:   require('../../sounds/jelly.mp3'),
  // lion:    require('../../sounds/lion.mp3'),
  // tiger:   require('../../sounds/tiger.mp3'),
  // monkey:  require('../../sounds/monkey.mp3'),
  // zebra:   require('../../sounds/zebra.mp3'),
  // hippo:   require('../../sounds/hippo.mp3'),
  // snake:   require('../../sounds/snake.mp3'),
  // car:     require('../../sounds/car.mp3'),
  // bus:     require('../../sounds/bus.mp3'),
  // train:   require('../../sounds/train.mp3'),
  // plane:   require('../../sounds/plane.mp3'),
  // bike:    require('../../sounds/bike.mp3'),
  // boat:    require('../../sounds/boat.mp3'),
  // red:     require('../../sounds/red.mp3'),
  // blue:    require('../../sounds/blue.mp3'),
  // yellow:  require('../../sounds/yellow.mp3'),
  // green:   require('../../sounds/green.mp3'),
  // pink:    require('../../sounds/pink.mp3'),
  // white:   require('../../sounds/white.mp3'),
};

let audioReady = false;
let currentSound: Audio.Sound | null = null;

async function ensureAudioReady() {
  if (audioReady) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioReady = true;
}

export async function playWordSound(word: string): Promise<void> {
  const key = word.toLowerCase();
  const asset = WORD_ASSETS[key];
  if (!asset) return;

  try {
    await ensureAudioReady();
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
    const { sound } = await Audio.Sound.createAsync(asset);
    currentSound = sound;
    await new Promise<void>(resolve => {
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          if (currentSound === sound) currentSound = null;
          resolve();
        }
      });
      sound.playAsync();
    });
  } catch {}
}

export async function stopWordSound(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => {});
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}
