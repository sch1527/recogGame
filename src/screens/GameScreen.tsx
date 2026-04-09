import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import FallingWord, { WordItem } from '../components/FallingWord';
import VoicePanel from '../components/VoicePanel';
import { getRandomWord } from '../data/words';

const SIDE_PANEL_W = 130; // VoicePanel 사이드바 너비 (가로 모드)

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

function isFuzzyMatch(target: string, spoken: string): boolean {
  const allowedDist = Math.floor(target.length * 0.2);
  return levenshtein(target.toLowerCase(), spoken.toLowerCase()) <= allowedDist;
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Game'> };

let uid = 0;
function newId() { return `w${Date.now()}_${uid++}`; }

function fallDuration(level: number) {
  return Math.max(3000, 7500 - (level - 1) * 600 + (Math.random() - 0.5) * 1200);
}
function spawnInterval(level: number) {
  return Math.max(1200, 3200 - (level - 1) * 300);
}

export default function GameScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const isLandscape = W > H;
  const gameW = isLandscape ? W - SIDE_PANEL_W : W;

  const [words, setWords] = useState<WordItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [cleared, setCleared] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [lastMatched, setLastMatched] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameAreaH, setGameAreaH] = useState(H);

  const active = useRef(true);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const livesRef = useRef(3);
  const wordsRef = useRef<WordItem[]>([]);
  const processedUpTo = useRef(0);
  // 단어 id → setTimeout 타이머: GameScreen에서 직접 관리
  const wordTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { setLevel(Math.floor(cleared / 5) + 1); }, [cleared]);

  function startListen() {
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', continuous: true, interimResults: true });
  }

  const handleBottom = useCallback((id: string) => {
    wordTimers.current.delete(id);
    if (!active.current) return;
    setWords(prev => prev.filter(w => w.id !== id));
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      active.current = false;
      ExpoSpeechRecognitionModule.stop();
      navigation.replace('GameOver', { score: scoreRef.current });
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
      if (active.current) startListen();
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
        for (let i = processedUpTo.current; i < allWords.length; i++) {
          matchWord(allWords[i]);
        }
        processedUpTo.current = allWords.length;
      }
    });
    const s4 = mod.addListener('error', () => {
      if (active.current) setTimeout(startListen, 100);
    });
    return () => { s1.remove(); s2.remove(); s3.remove(); s4.remove(); };
  }, []);

  const matchWord = useCallback((text: string) => {
    setWords(prev => {
      const now = Date.now();
      const candidates = prev
        .map((w, i) => ({ w, i, progress: (now - parseInt(w.id.slice(1))) / w.duration }))
        .filter(({ w }) => !w.cleared && isFuzzyMatch(w.text, text));
      if (candidates.length === 0) return prev;
      const { w: word, i: idx } = candidates.reduce((a, b) => b.progress > a.progress ? b : a);

      // 정답 처리 시 바닥 도달 타이머 취소
      const timer = wordTimers.current.get(word.id);
      if (timer !== undefined) {
        clearTimeout(timer);
        wordTimers.current.delete(word.id);
      }
      const pts = word.text.length * 10 + levelRef.current * 5;
      setScore(s => s + pts);
      setCleared(c => c + 1);
      setLastMatched(word.text);
      setTranscript('');
      return prev.map((w, i) => i === idx ? { ...w, cleared: true } : w);
    });
  }, []);

  const handleClearDone = useCallback((id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, []);

  // 단어 생성 + 바닥 도달 타이머 설정
  useEffect(() => {
    if (!active.current) return;
    const spawn = () => {
      if (!active.current || wordsRef.current.length >= 7) return;
      const existing = wordsRef.current.map(w => w.text);
      const text = getRandomWord(levelRef.current, existing);
      const x = Math.random() * (gameW - 110) + 8;
      const duration = fallDuration(levelRef.current);
      const id = newId();
      setWords(prev => [...prev, { id, text, x, duration, cleared: false }]);
      // GameScreen에서 직접 타이머 관리 → 컴포넌트 생명주기와 무관하게 동작
      const timer = setTimeout(() => handleBottom(id), duration);
      wordTimers.current.set(id, timer);
    };
    spawn();
    const t = setInterval(spawn, spawnInterval(level));
    return () => clearInterval(t);
  }, [level, gameW]);

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
        <View style={styles.col}>
          <Text style={styles.labelSm}>LEVEL</Text>
          <Text style={styles.levelVal}>{level}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.labelSm}>점수</Text>
          <Text style={styles.scoreVal}>{score}</Text>
        </View>
        <View style={styles.hearts}>
          {[0,1,2].map(i => (
            <Text key={i} style={[styles.heart, i >= lives && styles.heartLost]}>♥</Text>
          ))}
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
              onClearAnimationDone={handleClearDone}
            />
          ))}
        </View>

        <VoicePanel
          isListening={isListening}
          transcript={transcript}
          lastMatched={lastMatched}
          side={isLandscape}
        />
      </View>
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
  col: { alignItems: 'center', minWidth: 60 },
  labelSm: { color: '#6666aa', fontSize: 10, letterSpacing: 1 },
  levelVal: { color: '#aaaaff', fontSize: 20, fontWeight: 'bold' },
  scoreVal: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1, textAlign: 'center' },
  hearts: { flexDirection: 'row', gap: 4, minWidth: 60, justifyContent: 'flex-end' },
  heart: { fontSize: 20, color: '#ff4466' },
  heartLost: { color: '#330011' },
  body: { flex: 1, flexDirection: 'row' },
  game: { flex: 1, position: 'relative', overflow: 'hidden' },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: '#ff2244', opacity: 0.6,
  },
});
