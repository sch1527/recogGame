import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Text, StyleSheet } from 'react-native';

export interface WordItem {
  id: string;
  text: string;
  x: number;
  duration: number;
  cleared: boolean;
  missed: boolean;
  pausedMs: number; // 이 단어가 정지된 총 시간 (레이저 위치 계산에 사용)
  startY: number;   // 애니메이션 시작 translateY (화면 위 음수 가능)
  isHeal?: boolean; // 맞추면 HP 1 회복
  isSkill?: boolean; // 발화 시 같은 단어 전부 제거
}

interface Props {
  word: WordItem;
  screenHeight: number;
  paused?: boolean;
  onClearAnimationDone: (id: string) => void;
  onPaused?: (id: string, y: number) => void;   // 실제 멈춘 Y값 전달
  onResumed?: (id: string) => void;              // 애니메이션이 실제로 재개된 시점 전달
}

const FallingWord = memo(function FallingWord({ word, screenHeight, paused = false, onClearAnimationDone, onPaused, onResumed }: Props) {
  const translateY = useRef(new Animated.Value(word.startY)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const fallAnim   = useRef<Animated.CompositeAnimation | null>(null);

  // 현재 애니메이션 세그먼트 정보 (리스너 없이 시간으로 Y 계산)
  const segStartTime = useRef(Date.now());
  const segStartY    = useRef(word.startY);
  const segDuration  = useRef(word.duration);
  const segEndY      = useRef<number>(0); // screenHeight + 60, 초기화는 애니메이션 시작 시
  const hasBeenPaused = useRef(false);

  // 낙하 애니메이션 시작
  useEffect(() => {
    const endY = screenHeight + 60;
    segEndY.current = endY;
    segStartTime.current = Date.now();
    segStartY.current = word.startY;
    segDuration.current = word.duration;
    fallAnim.current = Animated.timing(translateY, {
      toValue: endY,
      duration: word.duration,
      easing: Easing.linear,
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
      hasBeenPaused.current = true;
      // 리스너 없이 시간으로 현재 Y 계산
      const elapsed = Date.now() - segStartTime.current;
      const progress = Math.min(elapsed / segDuration.current, 1);
      const currentY = segStartY.current + (segEndY.current - segStartY.current) * progress;
      onPaused?.(word.id, currentY);
    } else if (hasBeenPaused.current) {
      hasBeenPaused.current = false;
      const elapsed = Date.now() - segStartTime.current;
      const progress = Math.min(elapsed / segDuration.current, 1);
      const fromY = segStartY.current + (segEndY.current - segStartY.current) * progress;
      const endY = screenHeight + 60;
      const distRemain = Math.max(0, endY - fromY);
      const fullRange  = endY - word.startY;
      const remaining  = word.duration * (distRemain / fullRange);
      if (remaining <= 0) return;

      segStartTime.current = Date.now();
      segStartY.current = fromY;
      segDuration.current = remaining;
      segEndY.current = endY;

      fallAnim.current = Animated.timing(translateY, {
        toValue: endY,
        duration: remaining,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      onResumed?.(word.id);
      fallAnim.current.start();
    }
  }, [paused]);

  // 정답: 팝업 애니메이션
  useEffect(() => {
    if (!word.cleared) return;
    fallAnim.current?.stop();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0,   duration: 350, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 2.2,                useNativeDriver: true }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.cleared]);

  // 오답: 흔들림 + 페이드아웃
  useEffect(() => {
    if (!word.missed) return;
    fallAnim.current?.stop();
    Animated.sequence([
      Animated.timing(translateX, { toValue:  9, duration: 55,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -9, duration: 55,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  6, duration: 55,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  0, duration: 55,  useNativeDriver: true }),
      Animated.timing(opacity,    { toValue:  0, duration: 280, useNativeDriver: true }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.missed]);

  const color = word.missed
    ? '#ff2244'
    : word.isSkill ? '#ffe566'
    : word.isHeal ? '#ff88bb'
    : word.duration < 3500 ? '#ff4444' : word.duration < 5500 ? '#ffaa00' : '#44aaff';

  const boxStyle = word.missed
    ? { borderColor: 'rgba(255,30,60,0.8)', backgroundColor: 'rgba(180,0,30,0.45)' }
    : word.isSkill
    ? { borderColor: 'rgba(255,210,0,0.95)', backgroundColor: 'rgba(80,55,0,0.75)' }
    : word.isHeal
    ? { borderColor: 'rgba(255,100,160,0.9)', backgroundColor: 'rgba(120,0,60,0.55)' }
    : undefined;

  const isRow = word.isSkill || word.isHeal;

  return (
    <Animated.View
      style={[
        styles.box,
        boxStyle,
        isRow && styles.row,
        { left: word.x, transform: [{ translateY }, { translateX }, { scale }], opacity },
      ]}
    >
      {word.isSkill && <Text style={styles.skillIcon}>⚡</Text>}
      {word.isHeal && !word.isSkill && <Text style={styles.heart}>♥</Text>}
      <Text style={[styles.text, { color }]}>{word.text}</Text>
    </Animated.View>
  );
});

export default FallingWord;

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
  healRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillIcon: {
    fontSize: 14,
    color: '#ffe566',
  },
  heart: {
    fontSize: 14,
    color: '#ff88bb',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
