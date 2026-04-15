import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export interface WordItem {
  id: string;
  text: string;
  x: number;
  duration: number;
  cleared: boolean;
  missed: boolean;
}

interface Props {
  word: WordItem;
  screenHeight: number;
  paused?: boolean;
  onClearAnimationDone: (id: string) => void;
}

export default function FallingWord({ word, screenHeight, paused = false, onClearAnimationDone }: Props) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fallAnim = useRef<Animated.CompositeAnimation | null>(null);

  // 일시정지 추적
  const startTime    = useRef(Date.now());
  const pausedAt     = useRef<number | null>(null);
  const totalPausedMs = useRef(0);

  useEffect(() => {
    fallAnim.current = Animated.timing(translateY, {
      toValue: screenHeight + 60,
      duration: word.duration,
      useNativeDriver: true,
    });
    fallAnim.current.start();
    return () => fallAnim.current?.stop();
  }, []);

  // 일시정지 / 재개
  useEffect(() => {
    if (word.cleared || word.missed) return;

    if (paused) {
      fallAnim.current?.stop();
      pausedAt.current = Date.now();
    } else {
      // 누적 정지 시간 계산
      if (pausedAt.current !== null) {
        totalPausedMs.current += Date.now() - pausedAt.current;
        pausedAt.current = null;
      }
      // 실제 경과 시간(정지 시간 제외)으로 현재 Y 위치 복원
      const activeElapsed = Date.now() - startTime.current - totalPausedMs.current;
      const remaining = word.duration - activeElapsed;
      if (remaining <= 0) return;
      const currentY = -60 + (screenHeight + 120) * (activeElapsed / word.duration);
      translateY.setValue(currentY);
      fallAnim.current = Animated.timing(translateY, {
        toValue: screenHeight + 60,
        duration: remaining,
        useNativeDriver: true,
      });
      fallAnim.current.start();
    }
  }, [paused]);

  // 정답 처리: 팝업 애니메이션
  useEffect(() => {
    if (!word.cleared) return;
    fallAnim.current?.stop();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 2.2, useNativeDriver: true }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.cleared]);

  // 오답 처리: 흔들림 + 페이드아웃
  useEffect(() => {
    if (!word.missed) return;
    fallAnim.current?.stop();
    Animated.sequence([
      Animated.timing(translateX, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  6, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  0, duration: 55, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue:  0, duration: 280, useNativeDriver: true }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.missed]);

  const color = word.missed
    ? '#ff2244'
    : word.duration < 3500 ? '#ff4444' : word.duration < 5500 ? '#ffaa00' : '#44aaff';

  const boxStyle = word.missed
    ? { borderColor: 'rgba(255,30,60,0.8)', backgroundColor: 'rgba(180,0,30,0.45)' }
    : undefined;

  return (
    <Animated.View style={[
      styles.box,
      boxStyle,
      { left: word.x, transform: [{ translateY }, { translateX }, { scale }], opacity },
    ]}>
      <Text style={[styles.text, { color, textShadowColor: color }]}>{word.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
