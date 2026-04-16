import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, BackHandler, Animated, useWindowDimensions } from 'react-native';
import SettingsModal from '../components/SettingsModal';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import FallingWord, { WordItem } from '../components/FallingWord';
import VoicePanel from '../components/VoicePanel';
import Character, { CHAR_HEIGHT } from '../components/Character';
import LaserBeam, { BeamData } from '../components/LaserBeam';
import { getRandomWord, getStageInfo } from '../data/words';

const SIDE_PANEL_W = 130; // VoicePanel 사이드바 너비 (가로 모드)
// FallingWord 박스 높이 근사값: paddingVertical(12) + border(2) + fontSize(20) × lineHeight(1.3≈26) = 40
const WORD_BOX_H = 40;

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

function isFuzzyMatch(target: string, spoken: string): boolean {
  const t = target.toLowerCase();
  const s = normalizeSpoken(spoken.toLowerCase());
  const allowedDist = Math.floor(t.length * 0.2);
  if (levenshtein(t, s) <= allowedDist) return true;
  if (soundex(t) === soundex(s)) return true;
  if (t.startsWith(s) && s.length >= Math.ceil(t.length * 0.6)) return true;
  return false;
}

import type { RouteProp } from '@react-navigation/native';
import { unlockStage } from '../utils/unlocks';
import { useSettings } from '../context/SettingsContext';

const WORDS_TO_CLEAR_BY_DIFF = { easy: 8, normal: 12, hard: 18 } as const;

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

function fallDuration(stage: number) {
  return Math.max(4000, 7500 - (stage - 1) * 1000 + (Math.random() - 0.5) * 1200);
}
function spawnInterval(stage: number) {
  return Math.max(1500, 3000 - (stage - 1) * 500);
}

export default function GameScreen({ navigation, route }: Props) {
  useKeepAwake();
  const { stage } = route.params;
  const { width: W, height: H } = useWindowDimensions();
  const isLandscape = W > H;
  const gameW = isLandscape ? W - SIDE_PANEL_W : W;

  const { difficulty } = useSettings();
  const WORDS_TO_CLEAR = WORDS_TO_CLEAR_BY_DIFF[difficulty];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const isGamePaused = settingsOpen || countdown !== null;
  const [words, setWords] = useState<WordItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [cleared, setCleared] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [lastMatched, setLastMatched] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameAreaH, setGameAreaH] = useState(0); // onLayout 전까지 0
  const [laserBeams, setLaserBeams] = useState<BeamData[]>([]);

  const active = useRef(true);
  const scoreRef = useRef(0);

  const livesRef = useRef(3);
  const wordsRef = useRef<WordItem[]>([]);
  const processedUpTo = useRef(0);
  const gameAreaHRef = useRef(0);
  const gamWRef = useRef(gameW);
  // 단어 id → setTimeout 타이머
  const wordTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // 단어 id → 바닥 도달 절대 타임스탬프 (일시정지 후 재조정에 사용)
  const wordDeadlines = useRef<Map<string, number>>(new Map());
  // 단어 id → 일시정지 시점의 실제 translateY 값 (FallingWord에서 콜백으로 전달)
  const wordPausedYs = useRef<Map<string, number>>(new Map());
  // 일시정지 관련
  const isPausedRef = useRef(false);   // 동기적으로 최신 상태 유지 (리스너 closure 방지)
  const pauseStartRef = useRef<number | null>(null);
  const wasGamePausedRef = useRef(false); // 직전 렌더에서 isGamePaused 값 (spawn 재개 감지)
  isPausedRef.current = isGamePaused;  // 매 렌더마다 동기 갱신

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { gameAreaHRef.current = gameAreaH; }, [gameAreaH]);
  useEffect(() => { gamWRef.current = gameW; }, [gameW]);

  // 스테이지 클리어 감지
  useEffect(() => {
    if (cleared < WORDS_TO_CLEAR) return;
    active.current = false;
    ExpoSpeechRecognitionModule.stop();
    wordTimers.current.forEach(t => clearTimeout(t));
    wordTimers.current.clear();
    unlockStage(stage + 1).then(() => {
      navigation.replace('StageClear', { stage, score: scoreRef.current });
    });
  }, [cleared]);

  function startListen() {
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', continuous: true, interimResults: true });
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
    });
    const s2 = mod.addListener('end', () => {
      setIsListening(false);
      if (active.current && !isPausedRef.current) startListen();
    });
    const s3 = mod.addListener('result', (e: any) => {
      const text = e.results?.[0]?.transcript?.trim() ?? '';
      setTranscript(text);

      if (text) {
        const allWords = text.toLowerCase().split(/\s+/);
        // 새 발화 시작 시 transcript가 짧아지므로 processedUpTo 리셋
        if (allWords.length < processedUpTo.current) {
          processedUpTo.current = 0;
        }
        // 완성된 단어들(마지막 제외)만 processedUpTo로 스킵
        for (let i = processedUpTo.current; i < allWords.length - 1; i++) {
          matchWord(allWords[i]);
        }
        processedUpTo.current = Math.max(processedUpTo.current, allWords.length - 1);
        // 마지막 단어는 항상 재시도 (현재 발화 중인 단어, interim마다 업데이트됨)
        matchWord(allWords[allWords.length - 1]);
      }
    });
    const s4 = mod.addListener('error', () => {
      if (active.current && !isPausedRef.current) setTimeout(startListen, 100);
    });
    return () => { s1.remove(); s2.remove(); s3.remove(); s4.remove(); };
  }, []);

  const matchWord = useCallback((text: string) => {
    setWords(prev => {
      const now = Date.now();
      const candidates = prev
        .map((w, i) => ({ w, i, progress: (now - parseInt(w.id.slice(1)) - w.pausedMs) / w.duration }))
        .filter(({ w }) => !w.cleared && !w.missed && isFuzzyMatch(w.text, text));
      if (candidates.length === 0) return prev;
      const { w: word, i: idx } = candidates.reduce((a, b) => b.progress > a.progress ? b : a);

      // 정답 처리 시 바닥 도달 타이머 취소
      const timer = wordTimers.current.get(word.id);
      if (timer !== undefined) {
        clearTimeout(timer);
        wordTimers.current.delete(word.id);
      }
      wordDeadlines.current.delete(word.id);
      const pts = word.text.length * 10 + stage * 5;
      setScore(s => s + pts);
      setCleared(c => c + 1);
      setLastMatched(word.text);
      setTranscript('');

      // 레이저 빔 발사: 캐릭터 캐논 → 단어 현재 위치
      const areaH = gameAreaHRef.current;
      const areaW = gamWRef.current;
      // 단어 현재 Y 추정 (id에 spawn 타임스탬프 내장)
      const spawnTime = parseInt(word.id.slice(1));
      const elapsed = Date.now() - spawnTime - word.pausedMs;
      const progress = Math.min(Math.max(elapsed / word.duration, 0), 1);
      const wordY = -60 + (areaH + 120) * progress + 18; // 18 = 단어 박스 절반 높이 근사
      const wordX = word.x + 55;                          // 55 = 단어 박스 평균 절반 너비 근사
      // 캐릭터 캐논 위치: 게임 영역 하단 중앙, CHAR_HEIGHT 위
      const charCX = areaW / 2;
      const charCY = areaH - 10 - CHAR_HEIGHT;           // 캐논(머리 꼭대기) Y
      setLaserBeams(beams => [
        ...beams,
        { id: `beam_${word.id}`, x1: charCX, y1: charCY, x2: wordX, y2: wordY },
      ]);

      return prev.map((w, i) => i === idx ? { ...w, cleared: true } : w);
    });
  }, []);

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

  // 일시정지: useEffect가 아닌 함수로 동기 처리 (race condition 방지)
  // isPausedRef.current를 렌더 전에 즉시 true로 설정해 타이머 race window 제거
  const pauseGame = useCallback(() => {
    if (!active.current || settingsOpen) return;
    if (pauseStartRef.current === null) pauseStartRef.current = Date.now();
    isPausedRef.current = true; // 렌더 전 즉시 설정 → handleBottom race 방지
    setCountdown(null);
    ExpoSpeechRecognitionModule.stop();
    wordTimers.current.forEach(t => clearTimeout(t));
    wordTimers.current.clear();
    setSettingsOpen(true);
  }, [settingsOpen]);

  // 단어 생성 + 바닥 도달 타이머 설정
  useEffect(() => {
    const resumingFromPause = wasGamePausedRef.current && !isGamePaused;
    wasGamePausedRef.current = isGamePaused;
    if (!active.current || gameAreaH === 0 || isGamePaused) return; // 일시정지 중엔 스폰 안 함
    const spawn = () => {
      if (!active.current || wordsRef.current.length >= 7) return;
      const existing = wordsRef.current.map(w => w.text);
      const text = getRandomWord(stage, existing);
      const x = Math.random() * (gameW - 110) + 8;
      const duration = fallDuration(stage);
      const id = newId();
      setWords(prev => [...prev, { id, text, x, duration, cleared: false, missed: false, pausedMs: 0 }]);
      // translateY: -60 → areaH+60, word BOTTOM이 ground에 닿는 시점:
      // translateY = areaH - WORD_BOX_H → time = duration × (areaH - WORD_BOX_H + 60) / (areaH + 120)
      const areaH = gameAreaHRef.current;
      const timeToGround = Math.round(duration * (areaH - WORD_BOX_H + 60) / (areaH + 120));
      const deadline = Date.now() + timeToGround;
      wordDeadlines.current.set(id, deadline);
      const timer = setTimeout(() => handleBottom(id), timeToGround);
      wordTimers.current.set(id, timer);
    };
    if (!resumingFromPause) spawn(); // 재개 시 즉시 spawn 건너뜀 (중복 방지)
    const t = setInterval(spawn, spawnInterval(stage));
    return () => clearInterval(t);
  }, [stage, gameW, gameAreaH, isGamePaused]);

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

    // 위치 기반으로 t_to_ground 계산:
    // FallingWord에서 onPaused 콜백으로 받은 실제 translateY(pausedY)를 사용.
    // 시간 역산 방식(T_elapsed_anim)보다 rAF 프레임 오차(최대 16ms×누적)가 없어 정확함.
    // RESUME_ANIM_BUFFER: setCountdown(null) 후 렌더 2회가 완료되어야 애니메이션이 재개되므로
    //   그 지연(δ_resume) 동안 타이머가 먼저 발화하지 않도록 보정
    const RESUME_ANIM_BUFFER = 120; // ms
    const areaH = gameAreaHRef.current;
    const speed = 1 / (areaH + 120); // px per ms (duration 곱하면 실제 속도)
    wordsRef.current.filter(w => !w.cleared && !w.missed).forEach(w => {
      const fromY = wordPausedYs.current.get(w.id) ?? (() => {
        // fallback: 시간 기반 추정 (onPaused 콜백이 아직 안 온 경우)
        const T_elapsed_anim = T_pause - parseInt(w.id.slice(1)) - w.pausedMs;
        return -60 + (areaH + 120) * T_elapsed_anim / w.duration;
      })();
      // 단어 하단이 ground에 닿을 때까지 남은 거리 → 시간으로 변환
      const distToGround = Math.max(0, (areaH - WORD_BOX_H) - fromY);
      const t_to_ground = distToGround * w.duration * speed; // = distToGround / (areaH+120) * duration
      wordDeadlines.current.set(w.id, Date.now() + t_to_ground);
      wordTimers.current.set(w.id, setTimeout(() => handleBottom(w.id), t_to_ground + RESUME_ANIM_BUFFER));
    });
    wordPausedYs.current.clear();

    setWords(prev => prev.map(w =>
      !w.cleared && !w.missed ? { ...w, pausedMs: w.pausedMs + pausedDuration } : w
    ));

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

  const settingsOpenRef = useRef(settingsOpen);
  settingsOpenRef.current = settingsOpen;

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
      // 게임 종료 시 모든 단어 타이머 정리
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
            <Text style={styles.labelSm}>진행</Text>
            <Text style={styles.levelVal}>{cleared}/{WORDS_TO_CLEAR}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.labelSm}>점수</Text>
            <Text style={styles.scoreVal}>{score}</Text>
          </View>
        </View>
        <View style={styles.hearts}>
          {[0,1,2].map(i => (
            <Text key={i} style={[styles.heart, i >= lives && styles.heartLost]}>
              {i >= lives ? '♡' : '♥'}
            </Text>
          ))}
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
          isListening={isListening}
          transcript={transcript}
          lastMatched={lastMatched}
          side={isLandscape}
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
  hearts: { flexDirection: 'row', gap: 4, width: 84, justifyContent: 'flex-end' },
  heart: { fontSize: 20, color: '#ff4466' },
  heartLost: { color: '#553344', opacity: 0.35 },
  body: { flex: 1, flexDirection: 'row' },
  game: { flex: 1, position: 'relative', overflow: 'hidden' },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: '#ff2244', opacity: 0.6,
  },
  gearBtn: { marginLeft: 6, padding: 2 },
  gearIcon: { fontSize: 18, color: '#6666aa' },
});
