import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import type { CharacterTheme } from '../data/characters';

interface Props {
  x: number;
  bottom?: number;
  isListening: boolean;
  theme: CharacterTheme;
}

export const CHAR_WIDTH = 44;
export const CHAR_HEIGHT = 56;

const Character = memo(function Character({ x, bottom = 10, isListening, theme }: Props) {
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
      <View style={[styles.antenna, { backgroundColor: theme.accent }]} />
      <View style={[styles.antennaTip, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />

      <View style={[styles.head, { backgroundColor: theme.headColor, borderColor: theme.accent }]}>
        <View style={styles.eyeRow}>
          <Animated.View style={[styles.eye, { backgroundColor: theme.accent, shadowColor: theme.accent, opacity: eyeGlow }]} />
          <Animated.View style={[styles.eye, { backgroundColor: theme.accent, shadowColor: theme.accent, opacity: eyeGlow }]} />
        </View>
        <View style={[styles.mouth, { backgroundColor: theme.accent }]} />
      </View>

      <View style={[styles.cannonWrap]}>
        <View style={[styles.cannon, { backgroundColor: theme.accent, borderColor: theme.accent }]} />
      </View>

      <View style={[styles.body, { backgroundColor: theme.bodyColor, borderColor: theme.borderColor }]}>
        <View style={[styles.bodyDetail, {
          backgroundColor: `${theme.accent}40`,
          borderColor: `${theme.accent}66`,
        }]} />
      </View>

      <View style={styles.legRow}>
        <View style={[styles.leg, { backgroundColor: theme.bodyColor, borderColor: theme.borderColor }]} />
        <View style={[styles.leg, { backgroundColor: theme.bodyColor, borderColor: theme.borderColor }]} />
      </View>
    </Animated.View>
  );
});

export default Character;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CHAR_WIDTH,
    alignItems: 'center',
  },
  antenna: {
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  antennaTip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  head: {
    marginTop: 2,
    width: 28,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
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
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  mouth: {
    width: 14,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  cannonWrap: {
    position: 'absolute',
    top: 12 + 2,
    left: CHAR_WIDTH / 2 - 6,
    alignItems: 'center',
  },
  cannon: {
    width: 10,
    height: 6,
    borderRadius: 2,
    borderWidth: 1,
  },
  body: {
    marginTop: 2,
    width: 36,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyDetail: {
    width: 22,
    height: 8,
    borderRadius: 3,
    borderWidth: 1,
  },
  legRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 10,
  },
  leg: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
  },
});
