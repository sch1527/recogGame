import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export interface BeamData {
  id: string;
  x1: number; // 발사 기준점 X
  y1: number; // 발사 기준점 Y
  x2: number; // 목표 단어 중심 X
  y2: number; // 목표 단어 중심 Y
}

interface Props extends BeamData {
  onDone: (id: string) => void;
}

const LaserBeam = memo(function LaserBeam({ id, x1, y1, x2, y2, onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

  // 빔 중심점
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const BEAM_H = 3;

  useEffect(() => {
    // 순서: 즉시 나타남 → 두께 flash → fade out
    Animated.sequence([
      // 나타나기
      Animated.timing(opacity, { toValue: 1, duration: 40, useNativeDriver: true }),
      // 두께 flash (scaleY 커졌다 원복)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 5, duration: 60, useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
      ]),
      // 잠깐 유지
      Animated.delay(80),
      // fade out
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDone(id));
  }, []);

  return (
    <Animated.View
      style={[
        styles.beam,
        {
          width: length,
          height: BEAM_H,
          // midpoint 기준 배치 후 rotation (RN 기본 변환 기준점 = 뷰 중심)
          left: midX - length / 2,
          top: midY - BEAM_H / 2,
          opacity,
          transform: [
            { rotate: `${angleDeg}deg` },
            { scaleY },
          ],
        },
      ]}
    />
  );
});

export default LaserBeam;

const styles = StyleSheet.create({
  beam: {
    position: 'absolute',
    backgroundColor: '#00eeff',
    borderRadius: 2,
  },
});
