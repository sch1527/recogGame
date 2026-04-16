import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export interface WordItem {
  id: string;
  text: string;
  x: number;
  duration: number;
  cleared: boolean;
  missed: boolean;
  pausedMs: number; // 이 단어가 정지된 총 시간 (레이저 위치 계산에 사용)
}

interface Props {
  word: WordItem;
  screenHeight: number;
  paused?: boolean;
  onClearAnimationDone: (id: string) => void;
  onPaused?: (id: string, y: number) => void; // 실제 멈춘 Y값 전달
}

export default function FallingWord({ word, screenHeight, paused = false, onClearAnimationDone, onPaused }: Props) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const fallAnim   = useRef<Animated.CompositeAnimation | null>(null);

  // addListener로 실제 Y 값을 추적 (시간 기반 계산의 startTime 오차 제거)
  const pausedY     = useRef(-60);      // 정지 시점의 실제 Y
  const hasBeenPaused = useRef(false);  // 최초 마운트에서 resume 로직 방지

  useEffect(() => {
    const id = translateY.addListener(({ value }) => { pausedY.current = value; });
    return () => translateY.removeListener(id);
  }, []);

  // 낙하 애니메이션 시작
  useEffect(() => {
    fallAnim.current = Animated.timing(translateY, {
      toValue: screenHeight + 60,
      duration: word.duration,
      useNativeDriver: false,
    });
    fallAnim.current.start();
    return () => fallAnim.current?.stop();
  }, []);

  // 일시정지 / 재개
  useEffect(() => {
    if (word.cleared || word.missed) return;

    if (paused) {
      fallAnim.current?.stop();
      hasBeenPaused.current = true;
      onPaused?.(word.id, pausedY.current); // 실제 멈춘 Y값 전달
    } else if (hasBeenPaused.current) {
      // 정지 시점의 실제 Y에서 재개 (시간 기반 오차 없음)
      hasBeenPaused.current = false;
      const fromY    = pausedY.current;
      const progress = Math.max(0, Math.min(1, (fromY + 60) / (screenHeight + 120)));
      const remaining = word.duration * (1 - progress);
      if (remaining <= 0) return;

      fallAnim.current = Animated.timing(translateY, {
        toValue: screenHeight + 60,
        duration: remaining,
        useNativeDriver: false,
      });
      fallAnim.current.start();
    }
  }, [paused]);

  // 정답: 팝업 애니메이션
  useEffect(() => {
    if (!word.cleared) return;
    fallAnim.current?.stop();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0,   duration: 350, useNativeDriver: false }),
      Animated.spring(scale,   { toValue: 2.2,                useNativeDriver: false }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.cleared]);

  // 오답: 흔들림 + 페이드아웃
  useEffect(() => {
    if (!word.missed) return;
    fallAnim.current?.stop();
    Animated.sequence([
      Animated.timing(translateX, { toValue:  9, duration: 55,  useNativeDriver: false }),
      Animated.timing(translateX, { toValue: -9, duration: 55,  useNativeDriver: false }),
      Animated.timing(translateX, { toValue:  6, duration: 55,  useNativeDriver: false }),
      Animated.timing(translateX, { toValue:  0, duration: 55,  useNativeDriver: false }),
      Animated.timing(opacity,    { toValue:  0, duration: 280, useNativeDriver: false }),
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
