import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, BackHandler, AppState, Animated, useWindowDimensions } from 'react-native';
import SettingsModal from '../components/SettingsModal';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import FallingWord, { WordItem } from '../components/FallingWord';
import VoicePanel, { VoicePanelHandle } from '../components/VoicePanel';
import Character, { CHAR_HEIGHT } from '../components/Character';
import LaserBeam, { BeamData } from '../components/LaserBeam';
import { getWordPool, getStageInfo } from '../data/words';

// FallingWord 박스 높이 근사값: paddingVertical(12) + border(2) + fontSize(20) × lineHeight(1.3≈26) = 40
const WORD_BOX_H = 40;
// 화면 전체(startY=-60 → areaH+60)를 통과하는 기준 낙하 시간(ms) — 실제 단어별 duration은 startY에 따라 비례 조정
const FALL_BASE_DURATION = 45000;

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function soundex(word: string): string {
  const map: Record<string, string> = {
    b:'1',f:'1',p:'1',v:'1',
    c:'2',g:'2',j:'2',k:'2',q:'2',s:'2',x:'2',z:'2',
    d:'3',t:'3', l:'4', m:'5',n:'5', r:'6',
  };
  const s = word.toLowerCase();
  let code = s[0].toUpperCase();
  let prev = map[s[0]] ?? '0';
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const c = map[s[i]];
    if (c && c !== prev) { code += c; }
    prev = c ?? '0';
  }
  return code.padEnd(4, '0');
}

const NUM_TO_WORD: Record<string, string> = {
  '0':'zero','1':'one','2':'two','3':'three','4':'four',
  '5':'five','6':'six','7':'seven','8':'eight','9':'nine',
};

// 음성 인식이 숫자로 변환한 단어를 영어로 되돌림 (예: "3" → "three", "8" → "eight")
function normalizeSpoken(text: string): string {
  return text.replace(/\d+/g, n => NUM_TO_WORD[n] ?? n);
}

// b↔p, d↔t, g↔k, v↔f, z↔s 처럼 음성 엔진이 혼동하는 유성/무성 쌍을 통일
function phonetize(s: string): string {
  return s.replace(/[bp]/g, 'p').replace(/[dt]/g, 't').replace(/[gk]/g, 'k')
          .replace(/[fv]/g, 'f').replace(/[sz]/g, 's');
}

function isFuzzyMatch(target: string, spoken: string): boolean {
  const t = target.toLowerCase();
  const s = normalizeSpoken(spoken.toLowerCase());
  const allowedDist = Math.max(1, Math.ceil(t.length * 0.5)); // 5글자 → 3자 오차 허용 (apple/april 등 처리)
  if (levenshtein(t, s) <= allowedDist) return true;
  if (levenshtein(phonetize(t), phonetize(s)) <= allowedDist) return true; // 유성/무성 혼동 허용
  if (soundex(t) === soundex(s)) return true;
  if (t.startsWith(s) && s.length >= Math.ceil(t.length * 0.6)) return true;
  return false;
}

import type { RouteProp } from '@react-navigation/native';
import { unlockStage } from '../utils/unlocks';
import { useSettings } from '../context/SettingsContext';

const SCORE_TO_CLEAR_BY_DIFF = { easy: 800, normal: 1000, hard: 1200 } as const; // 스테이지 클리어 목표 점수

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

let uid = 0;
function newId() { return `w${Date.now()}_${uid++}`; }

function CountdownOverlay({ value }: { value: number }) {
  const scale = useRef(new Animated.Value(1.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 550, delay: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[cdStyles.wrap, { opacity }]}>
      <Animated.Text style={[cdStyles.num, { transform: [{ scale }] }]}>
        {value}
      </Animated.Text>
    </Animated.View>
  );
}

const cdStyles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,30,0.45)',
  },
  num: {
    fontSize: 130, fontWeight: '900', color: '#fff',
    textShadowColor: '#4466ff', textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
});

// ── HP 바 ────────────────────────────────────────────────────
function HpBar({ lives, maxLives }: { lives: number; maxLives: number }) {
  const pct = Math.max(0, Math.min(1, lives / maxLives));
  const color = pct > 0.6 ? '#44dd88' : pct > 0.3 ? '#ffaa22' : '#ff3355';
  const animPct = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(animPct, { toValue: pct, duration: 300, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={hpStyles.wrap}>
      <Text style={hpStyles.label}>HP</Text>
      <View style={hpStyles.track}>
        <Animated.View style={[hpStyles.fill, {
          width: animPct.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
          shadowColor: color,
        }]} />
      </View>
      {/* <Text style={[hpStyles.count, { color }]}>{lives}/{maxLives}</Text> */}
    </View>
  );
}

const hpStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: '#6666aa', fontSize: 10, letterSpacing: 1, width: 16 },
  track: {
    width: 102, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%', borderRadius: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3,
  },
  count: { fontSize: 11, fontWeight: 'bold', minWidth: 24, textAlign: 'right' },
});


const SKILL_MAX = 10;


export default function GameScreen({ navigation, route }: Props) {
  useKeepAwake();
  const { stage } = route.params;
  const { width: W } = useWindowDimensions();
  const gameW = W;

  const { difficulty } = useSettings();
  const SCORE_TO_CLEAR = SCORE_TO_CLEAR_BY_DIFF[difficulty];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const isGamePaused = settingsOpen || countdown !== null;
  const voicePanelRef = useRef<VoicePanelHandle>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isListening, setIsListening] = useState(false);
  const [gameAreaH, setGameAreaH] = useState(0); // onLayout 전까지 0
  const [laserBeams, setLaserBeams] = useState<BeamData[]>([]);
  const matchCountRef = useRef(0);

  const active = useRef(true);
  const scoreRef = useRef(0);

  const livesRef = useRef(3);
  const wordsRef = useRef<WordItem[]>([]);
  const processedUpTo = useRef(0);
  const pendingTextRef = useRef('');     // rAF 대기 중인 최신 transcript
  const rafPendingRef = useRef(false);   // rAF 예약 여부
  const lastSpokenWordRef = useRef(''); // 마지막으로 matchWord에 넘긴 단어 (중복 방지)
  const gameAreaHRef = useRef(0);
  const gamWRef = useRef(gameW);
  // 단어 id → setTimeout 타이머
  const wordTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // 단어 id → 바닥 도달 절대 타임스탬프 (일시정지 후 재조정에 사용)
  const wordDeadlines = useRef<Map<string, number>>(new Map());
  // 단어 id → 일시정지 시점의 실제 translateY 값 (FallingWord에서 콜백으로 전달)
  const wordPausedYs = useRef<Map<string, number>>(new Map());
  // 단어 id → 재개 시 애니메이션 시작 후 ground까지 남은 ms (onResumed에서 타이머 설정에 사용)
  const wordTToGround = useRef<Map<string, number>>(new Map());
  // 일시정지 관련
  const isPausedRef = useRef(false);   // 동기적으로 최신 상태 유지 (리스너 closure 방지)
  const pauseStartRef = useRef<number | null>(null);
  const spawnedRef = useRef(false);
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimerDeadline = useRef<number | null>(null);
  const pendingSpawnsRef = useRef<Array<{text: string}>>([]);
  const spawnNextWordRef = useRef<() => void>(() => {});
  isPausedRef.current = isGamePaused;  // 매 렌더마다 동기 갱신

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { gameAreaHRef.current = gameAreaH; }, [gameAreaH]);
  useEffect(() => { gamWRef.current = gameW; }, [gameW]);

  // 목표 점수 달성 시 스테이지 클리어
  useEffect(() => {
    if (!active.current || score < SCORE_TO_CLEAR) return;
    active.current = false;
    ExpoSpeechRecognitionModule.stop();
    if (spawnTimer.current !== null) { clearTimeout(spawnTimer.current); spawnTimer.current = null; }
    wordTimers.current.forEach(t => clearTimeout(t));
    wordTimers.current.clear();
    unlockStage(stage + 1).then(() => {
      navigation.replace('StageClear', { stage, score: scoreRef.current });
    });
  }, [score]);

  function startListen() {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      continuous: true,
      interimResults: true,
      addsPunctuation: false,
      requiresOnDeviceRecognition: false,
    });
  }

  const handleBottom = useCallback((id: string) => {
    wordTimers.current.delete(id);
    if (!active.current) return;
    // 일시정지 중 타이머가 발화된 경우(race condition) → 무시
    // wordDeadlines는 남겨두어 카운트다운 종료 시 재스케줄링에 사용
    if (isPausedRef.current) return;
    wordDeadlines.current.delete(id);
    // 즉시 제거 대신 missed 표시 → FallingWord가 오답 애니메이션 후 onClearAnimationDone 호출
    setWords(prev => prev.map(w => w.id === id ? { ...w, missed: true } : w));
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      active.current = false;
      ExpoSpeechRecognitionModule.stop();
      navigation.replace('GameOver', { stage, score: scoreRef.current });
    }
  }, [navigation]);

  useEffect(() => {
    const mod = ExpoSpeechRecognitionModule as any;
    const s1 = mod.addListener('start', () => {
      setIsListening(true);
      processedUpTo.current = 0;
      lastSpokenWordRef.current = '';
    });
    const s2 = mod.addListener('end', () => {
      if (active.current && !isPausedRef.current) {
        // 즉시 재시작 → isListening을 false로 바꾸지 않아 리렌더 방지
        startListen();
      } else {
        setIsListening(false);
      }
    });
    const s3 = mod.addListener('result', (e: any) => {
      const text = e.results?.[0]?.transcript?.trim() ?? '';
      voicePanelRef.current?.setTranscript(text);
      pendingTextRef.current = text;

      // rAF로 프레임당 1회만 매칭 처리 → 초당 수십 번 발생하는 result 이벤트 부하 제거
      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          rafPendingRef.current = false;
          const t = pendingTextRef.current;
          if (!t) return;
          const allWords = t.toLowerCase().split(/\s+/);
          if (allWords.length < processedUpTo.current) {
            processedUpTo.current = 0;
            lastSpokenWordRef.current = '';
          }
          for (let i = processedUpTo.current; i < allWords.length - 1; i++) {
            matchWord(allWords[i]);
          }
          processedUpTo.current = Math.max(processedUpTo.current, allWords.length - 1);
          // 마지막 단어가 이전과 다를 때만 시도 (같은 interim이 반복되는 경우 스킵)
          const lastWord = allWords[allWords.length - 1];
          if (lastWord !== lastSpokenWordRef.current) {
            lastSpokenWordRef.current = lastWord;
            matchWord(lastWord);
          }
        });
      }
    });
    const s4 = mod.addListener('error', () => {
      if (!active.current || isPausedRef.current) return;
      // 온디바이스 실패 → 클라우드로 영구 전환 후 재시작
      setTimeout(startListen, 100);
    });
    return () => { s1.remove(); s2.remove(); s3.remove(); s4.remove(); };
  }, []);

  const spawnSkillWordRef = useRef<() => void>(() => {});

  const spawnSkillWord = useCallback(() => {
    if (!active.current) return;
    const now = Date.now();
    const activeWords = wordsRef.current.filter(w => !w.cleared && !w.missed && !w.isSkill);

    // 가장 많이 등장한 단어 선택, 동수일 때 progress 높은 쪽 우선
    let targetText: string;
    if (activeWords.length > 0) {
      const map = new Map<string, { count: number; maxProgress: number }>();
      for (const w of activeWords) {
        const progress = (now - parseInt(w.id.slice(1)) - w.pausedMs) / w.duration;
        const cur = map.get(w.text) ?? { count: 0, maxProgress: 0 };
        map.set(w.text, { count: cur.count + 1, maxProgress: Math.max(cur.maxProgress, progress) });
      }
      let bestCount = 0, bestProgress = -1;
      targetText = '';
      for (const [text, { count, maxProgress }] of map) {
        if (count > bestCount || (count === bestCount && maxProgress > bestProgress)) {
          targetText = text; bestCount = count; bestProgress = maxProgress;
        }
      }
    } else {
      const pool = getWordPool(stage);
      targetText = pool[Math.floor(Math.random() * pool.length)];
    }

    const areaH = gameAreaHRef.current;
    const startY = -WORD_BOX_H;
    const wordRange = (areaH + 60) - startY;
    const duration = Math.round(FALL_BASE_DURATION * wordRange / (areaH + 120));
    const x = 8 + Math.random() * Math.max(0, gamWRef.current - 120);
    const id = newId();
    const w: WordItem = { id, text: targetText, x, duration, cleared: false, missed: false, pausedMs: 0, startY, isSkill: true };
    setWords(prev => [...prev, w]);
    const distToGround = Math.max(0, (areaH - WORD_BOX_H) - startY);
    const timeToGround = Math.round(duration * distToGround / wordRange);
    wordDeadlines.current.set(id, Date.now() + timeToGround);
    wordTimers.current.set(id, setTimeout(() => handleBottom(id), timeToGround));
  }, [handleBottom, stage]);
  spawnSkillWordRef.current = spawnSkillWord;

  const matchWord = useCallback((text: string) => {
    const now = Date.now();
    const current = wordsRef.current;
    const candidates = current
      .map((w, i) => ({ w, i, progress: (now - parseInt(w.id.slice(1)) - w.pausedMs) / w.duration }))
      .filter(({ w }) => !w.cleared && !w.missed && isFuzzyMatch(w.text, text));
    if (candidates.length === 0) return;

    const { w: word, i: idx } = candidates.reduce((a, b) => {
      if (b.w.isSkill !== a.w.isSkill) return b.w.isSkill ? b : a;
      if (b.w.isHeal !== a.w.isHeal) return b.w.isHeal ? b : a;
      return b.progress > a.progress ? b : a;
    });

    // 렌더 전에 ref를 즉시 갱신 → 연속 호출 시 같은 단어 중복 매칭 방지
    if (word.isSkill) {
      wordsRef.current = current.map(w =>
        !w.cleared && !w.missed && w.text === word.text ? { ...w, cleared: true } : w
      );
    } else {
      wordsRef.current = current.map((w, i) => i === idx ? { ...w, cleared: true } : w);
    }

    const cancelWord = (ww: WordItem) => {
      const t = wordTimers.current.get(ww.id);
      if (t !== undefined) { clearTimeout(t); wordTimers.current.delete(ww.id); }
      wordDeadlines.current.delete(ww.id);
      wordTToGround.current.delete(ww.id);
    };

    const areaH = gameAreaHRef.current;
    const areaW = gamWRef.current;
    const fireBeam = (ww: WordItem, beamId: string) => {
      const elapsed = now - parseInt(ww.id.slice(1)) - ww.pausedMs;
      const progress = Math.min(Math.max(elapsed / ww.duration, 0), 1);
      const wordY = ww.startY + ((areaH + 60) - ww.startY) * progress + 18;
      const wordX = ww.x + 55;
      setLaserBeams(beams => [...beams, { id: beamId, x1: areaW / 2, y1: areaH - 10 - CHAR_HEIGHT, x2: wordX, y2: wordY }]);
    };

    cancelWord(word);
    setScore(s => s + word.text.length * 10 + stage * 5);
    fireBeam(word, `beam_${word.id}`);

    if (word.isHeal && livesRef.current < 3) {
      livesRef.current += 1;
      setLives(livesRef.current);
    }

    matchCountRef.current += 1;
    const newCharge = matchCountRef.current % SKILL_MAX;
    voicePanelRef.current?.setSkillCharge(newCharge);
    if (newCharge === 0) setTimeout(() => spawnSkillWordRef.current(), 50);

    if (word.isSkill) {
      const sameText = current.filter(w => !w.cleared && !w.missed && w.text === word.text && w.id !== word.id);
      sameText.forEach(w => {
        cancelWord(w);
        setScore(s => s + w.text.length * 10 + stage * 5);
        fireBeam(w, `beam_skill_${w.id}`);
      });
      voicePanelRef.current?.setLastMatched(`⚡ ${word.text}`);
      voicePanelRef.current?.setTranscript('');
      // updater 형태 유지 → 동시에 스폰된 단어가 있어도 손실 없음
      setWords(prev => prev.map(w => !w.cleared && !w.missed && w.text === word.text ? { ...w, cleared: true } : w));
      return;
    }

    voicePanelRef.current?.setLastMatched(word.text);
    voicePanelRef.current?.setTranscript('');
    setWords(prev => prev.map((w, i) => i === idx ? { ...w, cleared: true } : w));
  }, [stage]);

  const handleClearDone = useCallback((id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleBeamDone = useCallback((id: string) => {
    setLaserBeams(prev => prev.filter(b => b.id !== id));
  }, []);

  // FallingWord가 일시정지될 때 실제 translateY를 수집
  const handleWordPaused = useCallback((id: string, y: number) => {
    wordPausedYs.current.set(id, y);
  }, []);

  // FallingWord가 애니메이션을 실제로 시작한 순간에 타이머 설정
  // → δ_resume(재개 렌더 지연) 이후에 t_to_ground 타이머를 설정하므로 버퍼 불필요
  const handleWordResumed = useCallback((id: string) => {
    const t_to_ground = wordTToGround.current.get(id);
    if (t_to_ground === undefined) return; // 이미 정답 처리 또는 재일시정지됨
    wordTToGround.current.delete(id);
    wordTimers.current.set(id, setTimeout(() => handleBottom(id), Math.max(0, t_to_ground)));
  }, [handleBottom]);

  const SPAWN_INTERVAL_MIN = 5000;
  const SPAWN_INTERVAL_MAX = 8000;

  const spawnNextWord = useCallback(() => {
    if (!active.current || pendingSpawnsRef.current.length === 0) return;
    const { text } = pendingSpawnsRef.current[0];
    pendingSpawnsRef.current = pendingSpawnsRef.current.slice(1);

    const areaH     = gameAreaHRef.current;
    const startY    = -WORD_BOX_H;
    const totalRng  = areaH + 120;
    const wordRange = (areaH + 60) - startY;
    const duration  = Math.round(FALL_BASE_DURATION * wordRange / totalRng);
    const x         = 8 + Math.random() * Math.max(0, gamWRef.current - 120);
    const id        = newId();
    const isHeal    = livesRef.current < 3 && Math.random() < 0.15;
    const w: WordItem = { id, text, x, duration, cleared: false, missed: false, pausedMs: 0, startY, isHeal };

    setWords(prev => [...prev, w]);

    const distToGround = Math.max(0, (areaH - WORD_BOX_H) - startY);
    const timeToGround = Math.round(duration * distToGround / wordRange);
    wordDeadlines.current.set(id, Date.now() + timeToGround);
    wordTimers.current.set(id, setTimeout(() => handleBottom(id), timeToGround));

    // pending이 비었으면 풀에서 다시 채워 무한 스폰
    if (pendingSpawnsRef.current.length === 0) {
      const pool = getWordPool(stage);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      pendingSpawnsRef.current = shuffled.map((t) => ({ text: t }));
    }

    const delay = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    spawnTimerDeadline.current = Date.now() + delay;
    spawnTimer.current = setTimeout(() => spawnNextWordRef.current(), delay);
  }, [handleBottom]);
  spawnNextWordRef.current = spawnNextWord;

  // 일시정지: useEffect가 아닌 함수로 동기 처리 (race condition 방지)
  // isPausedRef.current를 렌더 전에 즉시 true로 설정해 타이머 race window 제거
  const pauseGame = useCallback(() => {
    if (!active.current || settingsOpen) return;
    if (pauseStartRef.current === null) pauseStartRef.current = Date.now();
    isPausedRef.current = true;
    setCountdown(null);
    ExpoSpeechRecognitionModule.stop();
    if (spawnTimer.current !== null) { clearTimeout(spawnTimer.current); spawnTimer.current = null; }
    wordTimers.current.forEach(t => clearTimeout(t));
    wordTimers.current.clear();
    wordTToGround.current.clear();
    setSettingsOpen(true);
  }, [settingsOpen]);

  useEffect(() => {
    if (!active.current || gameAreaH === 0 || isGamePaused || spawnedRef.current) return;
    spawnedRef.current = true;

    const pool = getWordPool(stage);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    pendingSpawnsRef.current = shuffled.map((text) => ({ text }));
    spawnNextWord();
  }, [stage, gameW, gameAreaH, isGamePaused, spawnNextWord]);

  // 카운트다운: 3→2→1→0 후 재개
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
      return () => clearTimeout(t);
    }

    // countdown === 0 → 실제 재개
    if (!active.current || pauseStartRef.current === null) { setCountdown(null); return; }
    const T_pause = pauseStartRef.current; // 일시정지 시작 시각 (누적 오차 없이 직접 계산에 사용)
    const pausedDuration = Date.now() - T_pause;
    pauseStartRef.current = null;

    // isPausedRef를 즉시 해제: handleBottom이 이 이후부터 정상 동작
    isPausedRef.current = false;

    // 위치 기반으로 t_to_ground 계산 후 wordTToGround에 저장.
    // 타이머는 onResumed 콜백(FallingWord가 애니메이션을 실제로 시작한 순간)에서 설정 →
    // δ_resume(재개 렌더 지연) 문제 완전 제거, 버퍼 불필요
    const areaH = gameAreaHRef.current;
    wordsRef.current.filter(w => !w.cleared && !w.missed).forEach(w => {
      const fromY = wordPausedYs.current.get(w.id) ?? (() => {
        // fallback: 시간 기반 추정 (onPaused 콜백이 아직 안 온 경우)
        const T_elapsed_anim = T_pause - parseInt(w.id.slice(1)) - w.pausedMs;
        return w.startY + ((areaH + 60) - w.startY) * T_elapsed_anim / w.duration;
      })();
      // 단어 하단이 ground에 닿을 때까지 남은 거리 → 시간으로 변환
      const distToGround = Math.max(0, (areaH - WORD_BOX_H) - fromY);
      const fullRange    = (areaH + 60) - w.startY;
      const t_to_ground  = distToGround * w.duration / fullRange;
      wordTToGround.current.set(w.id, t_to_ground); // onResumed에서 타이머 설정에 사용
      wordDeadlines.current.set(w.id, Date.now() + t_to_ground); // 정리용
    });
    wordPausedYs.current.clear();

    setWords(prev => prev.map(w =>
      !w.cleared && !w.missed ? { ...w, pausedMs: w.pausedMs + pausedDuration } : w
    ));

    // 일시정지 중 등장하지 못한 단어가 있으면 남은 시간만큼만 기다려 재스케줄링
    if (pendingSpawnsRef.current.length > 0 && spawnTimerDeadline.current !== null) {
      const remaining = Math.max(0, spawnTimerDeadline.current - T_pause);
      spawnTimerDeadline.current = Date.now() + remaining;
      spawnTimer.current = setTimeout(() => spawnNextWordRef.current(), remaining);
    }

    startListen();
    setCountdown(null);
  }, [countdown]);

  // 설정창 닫기: setSettingsOpen(false) + setCountdown(3)을 같은 핸들러에서 호출해
  // React 18 배칭으로 isGamePaused가 false로 떨어지는 순간 없이 카운트다운 진입
  const handleCloseSettings = useCallback(() => {
    if (pauseStartRef.current !== null) setCountdown(3);
    setSettingsOpen(false);
  }, []);
  const handleCloseSettingsRef = useRef(handleCloseSettings);
  handleCloseSettingsRef.current = handleCloseSettings;

  const pauseGameRef = useRef(pauseGame);
  pauseGameRef.current = pauseGame;

  const settingsOpenRef = useRef(settingsOpen);
  settingsOpenRef.current = settingsOpen;

  // 홈 버튼 / 앱 전환으로 백그라운드 진입 시 일시정지
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        pauseGameRef.current();
      }
    });
    return () => sub.remove();
  }, []);

  // Android 뒤로가기 → 설정창 토글
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!active.current) return false;
      if (settingsOpenRef.current) {
        handleCloseSettingsRef.current();
      } else {
        pauseGame();
      }
      return true;
    });
    return () => sub.remove();
  }, []);

  // 홈으로 이동 (설정창 버튼)
  const handleGoHome = useCallback(() => {
    active.current = false;
    ExpoSpeechRecognitionModule.stop();
    if (spawnTimer.current !== null) { clearTimeout(spawnTimer.current); spawnTimer.current = null; }
    wordTimers.current.forEach(t => clearTimeout(t));
    wordTimers.current.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  // 최초 음성 인식 시작
  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync().then(r => {
      if (r.granted) startListen();
    });
    return () => {
      active.current = false;
      ExpoSpeechRecognitionModule.stop();
      if (spawnTimer.current !== null) { clearTimeout(spawnTimer.current); spawnTimer.current = null; }
      wordTimers.current.forEach(timer => clearTimeout(timer));
      wordTimers.current.clear();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.col}>
            <Text style={styles.labelSm}>STAGE {getStageInfo(stage).emoji}</Text>
            <Text style={styles.levelVal}>{getStageInfo(stage).label}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.labelSm}>점수</Text>
            <Text style={styles.scoreVal}>{score}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.labelSm}>목표</Text>
            <Text style={styles.levelVal}>{SCORE_TO_CLEAR}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <HpBar lives={lives} maxLives={3} />
          <TouchableOpacity onPress={pauseGame} style={styles.gearBtn} hitSlop={8}>
            <Text style={styles.gearIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View
          style={styles.game}
          onLayout={e => setGameAreaH(e.nativeEvent.layout.height)}
        >
          <View style={styles.ground} />
          {words.map(w => (
            <FallingWord
              key={w.id}
              word={w}
              screenHeight={gameAreaH}
              paused={isGamePaused}
              onClearAnimationDone={handleClearDone}
              onPaused={handleWordPaused}
              onResumed={handleWordResumed}
            />
          ))}
          {laserBeams.map(b => (
            <LaserBeam key={b.id} {...b} onDone={handleBeamDone} />
          ))}
          <Character
            x={gameW / 2}
            bottom={10}
            isListening={isListening}
          />
          {/* 카운트다운 오버레이 */}
          {countdown !== null && countdown > 0 && (
            <CountdownOverlay key={countdown} value={countdown} />
          )}
        </View>

        <VoicePanel
          ref={voicePanelRef}
          isListening={isListening}
        />
      </View>

      <SettingsModal
        visible={settingsOpen}
        onClose={handleCloseSettings}
        onGoHome={handleGoHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,40,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(100,100,255,0.3)',
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  col: { alignItems: 'center', minWidth: 60 },
  labelSm: { color: '#6666aa', fontSize: 10, letterSpacing: 1 },
  levelVal: { color: '#aaaaff', fontSize: 16, fontWeight: 'bold' },
  scoreVal: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { flex: 1, flexDirection: 'column' },
  game: { flex: 1, position: 'relative', overflow: 'hidden' },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: '#ff2244', opacity: 0.6,
  },
  gearBtn: { marginLeft: 6, padding: 2 },
  gearIcon: { fontSize: 18, color: '#6666aa' },
});
