import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export interface VoicePanelHandle {
  setTranscript: (t: string) => void;
  setLastMatched: (word: string) => void;
  setSkillCharge: (charge: number) => void;
}

const SKILL_MAX = 10;

interface Props {
  isListening: boolean;
}

const VoicePanel = forwardRef<VoicePanelHandle, Props>(function VoicePanel({ isListening }, ref) {
  const [transcript, setTranscript] = useState('');
  const [lastMatched, setLastMatched] = useState('');
  const [skillCharge, setSkillCharge] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const matchOpacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    setTranscript,
    setLastMatched,
    setSkillCharge,
  }));

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

  const ready = skillCharge >= SKILL_MAX;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mic, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.micIcon}>{isListening ? '🎤' : '🔇'}</Text>
      </Animated.View>
      <View style={styles.textArea}>
        <Text style={styles.status}>{isListening ? '듣는 중...' : '대기 중'}</Text>
        {!!transcript && <Text style={styles.transcript} numberOfLines={1}>"{transcript}"</Text>}
      </View>
      <View style={styles.skillWrap}>
        <Text style={[styles.skillIcon, ready && styles.skillIconReady]}>⚡</Text>
        <View style={styles.pips}>
          {Array.from({ length: SKILL_MAX }, (_, i) => (
            <View key={i} style={[styles.pip, i < skillCharge && styles.pipFilled]} />
          ))}
        </View>
      </View>
      {!!lastMatched && (
        <Animated.Text style={[styles.matched, { opacity: matchOpacity }]}>✓ {lastMatched}</Animated.Text>
      )}
    </View>
  );
});

export default VoicePanel;

const styles = StyleSheet.create({
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
  skillWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  skillIcon: { fontSize: 11, color: '#555599' },
  skillIconReady: { color: '#ffdd22' },
  pips: { flexDirection: 'row', gap: 2 },
  pip: { width: 5, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  pipFilled: { backgroundColor: '#ffcc00' },
});
