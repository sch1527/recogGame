import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  isListening: boolean;
  transcript: string;
  lastMatched: string;
  side?: boolean; // 가로 모드에서 우측 사이드바로 표시
}

export default function VoicePanel({ isListening, transcript, lastMatched, side = false }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const matchOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    if (!lastMatched) return;
    matchOpacity.setValue(1);
    Animated.timing(matchOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
  }, [lastMatched]);

  if (side) {
    return (
      <View style={styles.sideContainer}>
        <Animated.View style={[styles.mic, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.micIcon}>{isListening ? '🎤' : '🔇'}</Text>
        </Animated.View>
        <Text style={styles.sideStatus}>{isListening ? '듣는 중' : '대기 중'}</Text>
        {!!transcript && (
          <Text style={styles.sideTranscript} numberOfLines={2}>"{transcript}"</Text>
        )}
        {!!lastMatched && (
          <Animated.Text style={[styles.sideMatched, { opacity: matchOpacity }]}>
            ✓ {lastMatched}
          </Animated.Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mic, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.micIcon}>{isListening ? '🎤' : '🔇'}</Text>
      </Animated.View>
      <View style={styles.textArea}>
        <Text style={styles.status}>{isListening ? '듣는 중...' : '대기 중'}</Text>
        {!!transcript && <Text style={styles.transcript} numberOfLines={1}>"{transcript}"</Text>}
      </View>
      {!!lastMatched && (
        <Animated.Text style={[styles.matched, { opacity: matchOpacity }]}>✓ {lastMatched}</Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 하단 바 (세로 모드)
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,30,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100,100,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  mic: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(100,100,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  micIcon: { fontSize: 22 },
  textArea: { flex: 1 },
  status: { color: 'rgba(200,200,255,0.6)', fontSize: 12 },
  transcript: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
  matched: { color: '#44ff88', fontSize: 14, fontWeight: 'bold' },

  // 우측 사이드바 (가로 모드)
  sideContainer: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,30,0.85)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(100,100,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 8,
  },
  sideStatus: { color: 'rgba(200,200,255,0.6)', fontSize: 11, textAlign: 'center' },
  sideTranscript: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sideMatched: { color: '#44ff88', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
});
