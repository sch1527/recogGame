import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export interface WordItem {
  id: string;
  text: string;
  x: number;
  duration: number;
  cleared: boolean;
}

interface Props {
  word: WordItem;
  screenHeight: number;
  onClearAnimationDone: (id: string) => void;
}

export default function FallingWord({ word, screenHeight, onClearAnimationDone }: Props) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fallAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    fallAnim.current = Animated.timing(translateY, {
      toValue: screenHeight + 60,
      duration: word.duration,
      useNativeDriver: true,
    });
    fallAnim.current.start();
    return () => fallAnim.current?.stop();
  }, []);

  useEffect(() => {
    if (!word.cleared) return;
    fallAnim.current?.stop();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 2.2, useNativeDriver: true }),
    ]).start(() => onClearAnimationDone(word.id));
  }, [word.cleared]);

  const color = word.duration < 3500 ? '#ff4444' : word.duration < 5500 ? '#ffaa00' : '#44aaff';

  return (
    <Animated.View style={[styles.box, { left: word.x, transform: [{ translateY }, { scale }], opacity }]}>
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
