import React, { useRef, useEffect } from 'react';
import {
  Animated, View, Text, TouchableOpacity, StyleSheet,
  Pressable, PanResponder, LayoutChangeEvent,
} from 'react-native';
import { useSettings, Difficulty } from '../context/SettingsContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  showDifficulty?: boolean;
  onGoHome?: () => void;
}

const DIFF_OPTIONS: { label: string; value: Difficulty; color: string }[] = [
  { label: 'Easy',   value: 'easy',   color: '#44cc88' },
  { label: 'Normal', value: 'normal', color: '#4466ff' },
  { label: 'Hard',   value: 'hard',   color: '#ff4466' },
];

const THUMB_R = 10;

// ── 볼륨 슬라이더 ─────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function VolumeSlider({ label, value, onChange }: SliderProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const trackW = useRef(0);
  const startTouchX = useRef(0);

  const clampVol = (x: number): number => {
    if (trackW.current === 0) return 0;
    return Math.min(100, Math.max(0, Math.round((x / trackW.current) * 100)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        startTouchX.current = e.nativeEvent.locationX;
        onChangeRef.current(clampVol(e.nativeEvent.locationX));
      },
      onPanResponderMove: (_e, gs) => {
        onChangeRef.current(clampVol(startTouchX.current + gs.dx));
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={slStyles.sliderBlock}>
      <View style={slStyles.sliderLabelRow}>
        <Text style={slStyles.sliderLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => onChangeRef.current(value > 0 ? 0 : 75)}
          hitSlop={10}
        >
          <Text style={slStyles.muteIcon}>{value === 0 ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>
      <View style={slStyles.row}>
        <View style={slStyles.trackArea} onLayout={onLayout} {...panResponder.panHandlers}>
          <View style={slStyles.track} />
          <View style={[slStyles.fill, { width: `${value}%` as any }]} />
          <View style={[slStyles.thumb, { left: `${value}%` as any, marginLeft: -THUMB_R }]} pointerEvents="none" />
        </View>
        <Text style={slStyles.pct}>{value}%</Text>
      </View>
    </View>
  );
}

const slStyles = StyleSheet.create({
  sliderBlock: { marginBottom: 12 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { color: '#8888cc', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muteBtn: { paddingVertical: 4 },
  muteIcon: { fontSize: 18 },
  trackArea: { flex: 1, height: 28, justifyContent: 'center' },
  track: {
    position: 'absolute', left: 0, right: 0, height: 4,
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: {
    position: 'absolute', left: 0, height: 4,
    borderRadius: 2, backgroundColor: '#4466ff',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_R * 2, height: THUMB_R * 2, borderRadius: THUMB_R,
    backgroundColor: '#fff', top: (28 - THUMB_R * 2) / 2,
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 6, elevation: 4,
  },
  pct: { color: '#6666aa', fontSize: 12, width: 36, textAlign: 'right' },
});

// ── 메인 설정 패널 ────────────────────────────────────────────

export default function SettingsModal({ visible, onClose, showDifficulty = false, onGoHome }: Props) {
  const { bgmVolume, sfxVolume, setBgmVolume, setSfxVolume, difficulty, setDifficulty } = useSettings();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // visible=false 이고 완전히 투명해지면 터치를 막지 않도록 pointerEvents 제어
  const pointerEvents = visible ? 'auto' : 'none';

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={pointerEvents}>
      {/* 오버레이 탭 → 닫기 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙  설정</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 볼륨 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>볼륨</Text>
          <VolumeSlider label="배경음" value={bgmVolume} onChange={setBgmVolume} />
          <VolumeSlider label="효과음" value={sfxVolume} onChange={setSfxVolume} />
        </View>

        {/* 난이도 */}
        {showDifficulty && (
          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.sectionLabel}>난이도</Text>
            <View style={styles.diffRow}>
              {DIFF_OPTIONS.map(({ label, value, color }) => {
                const active = difficulty === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.diffBtn, active && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setDifficulty(value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.diffText, active && styles.diffTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.diffHint}>
              {difficulty === 'easy' ? '클리어 단어 6개' :
               difficulty === 'hard' ? '클리어 단어 8개' : '클리어 단어 10개'}
            </Text>
          </View>
        )}

        {/* 홈으로 */}
        {onGoHome && (
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.75}>
            <Text style={styles.homeBtnText}>🏠  홈으로</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  panel: {
    backgroundColor: '#0d0d3a',
    borderRadius: 20,
    padding: 24,
    width: 300,
    borderWidth: 1,
    borderColor: 'rgba(100,100,255,0.4)',
    shadowColor: '#4466ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  closeBtn: { padding: 4 },
  closeText: { color: '#6666aa', fontSize: 20, fontWeight: 'bold' },
  section: { marginBottom: 22 },
  sectionLast: { marginBottom: 0 },
  sectionLabel: {
    color: '#8888cc', fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 12,
  },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  diffBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(100,100,255,0.25)',
  },
  diffText: { color: '#8888cc', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  diffTextActive: { color: '#fff' },
  diffHint: { color: '#6666aa', fontSize: 11, textAlign: 'center', letterSpacing: 0.5 },
  homeBtn: {
    marginTop: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)',
  },
  homeBtnText: { color: '#ff8888', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
