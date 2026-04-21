import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  x: number;        // 게임 영역 중앙 X (캐릭터 중심 기준)
  bottom?: number;  // 바닥으로부터 거리
  isListening: boolean;
}

// 캐릭터 크기 상수 (외부에서 빔 기준점 계산에 사용)
export const CHAR_WIDTH = 44;
export const CHAR_HEIGHT = 56; // 머리 22 + 몸통 26 + 다리 8

const Character = memo(function Character({ x, bottom = 10, isListening }: Props) {
  const eyeGlow = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (isListening) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(eyeGlow, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(eyeGlow, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      eyeGlow.setValue(0.7);
    }
  }, [isListening]);

  return (
    <Animated.View style={[styles.container, { left: x - CHAR_WIDTH / 2, bottom }]}>
      {/* 안테나 */}
      <View style={styles.antenna} />
      <View style={styles.antennaTip} />

      {/* 머리 */}
      <View style={styles.head}>
        <View style={styles.eyeRow}>
          <Animated.View style={[styles.eye, { opacity: eyeGlow }]} />
          <Animated.View style={[styles.eye, { opacity: eyeGlow }]} />
        </View>
        <View style={styles.mouth} />
      </View>

      {/* 캐논(총구) - 레이저 발사 지점 */}
      <View style={styles.cannonWrap}>
        <View style={styles.cannon} />
      </View>

      {/* 몸통 */}
      <View style={styles.body}>
        <View style={styles.bodyDetail} />
      </View>

      {/* 다리 */}
      <View style={styles.legRow}>
        <View style={styles.leg} />
        <View style={styles.leg} />
      </View>
    </Animated.View>
  );
});

export default Character;

const HEAD_COLOR = '#3399ff';
const BODY_COLOR = '#1155cc';
const ACCENT = '#00eeff';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CHAR_WIDTH,
    alignItems: 'center',
  },
  // 안테나
  antenna: {
    width: 2,
    height: 10,
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  antennaTip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginTop: -3,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 머리
  head: {
    marginTop: 2,
    width: 28,
    height: 22,
    backgroundColor: HEAD_COLOR,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  eye: {
    width: 6,
    height: 6,
    backgroundColor: ACCENT,
    borderRadius: 3,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  mouth: {
    width: 14,
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
    opacity: 0.7,
  },
  // 캐논 (머리 위에 돌출)
  cannonWrap: {
    position: 'absolute',
    top: 12 + 2, // antennaTip(6) + antenna(10) + antennaTip offset 보정 후 머리 시작점
    left: CHAR_WIDTH / 2 - 6,
    alignItems: 'center',
  },
  cannon: {
    width: 10,
    height: 6,
    backgroundColor: '#aaddff',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  // 몸통
  body: {
    marginTop: 2,
    width: 36,
    height: 22,
    backgroundColor: BODY_COLOR,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3366cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyDetail: {
    width: 22,
    height: 8,
    backgroundColor: 'rgba(0,200,255,0.25)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.4)',
  },
  // 다리
  legRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 10,
  },
  leg: {
    width: 8,
    height: 8,
    backgroundColor: BODY_COLOR,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#3366cc',
  },
});
