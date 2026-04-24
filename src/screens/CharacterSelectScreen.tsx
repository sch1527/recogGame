import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { CHARACTERS } from '../data/characters';
import { useSettings } from '../context/SettingsContext';
import Character, { CHAR_WIDTH, CHAR_HEIGHT } from '../components/Character';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CharacterSelect'> };

const PREVIEW_SCALE = 2.8;
const PREVIEW_W = CHAR_WIDTH * PREVIEW_SCALE;
const PREVIEW_H = CHAR_HEIGHT * PREVIEW_SCALE;

function StatBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={stat.row}>
      <Text style={stat.label}>{label}</Text>
      <View style={stat.track}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[stat.pip, i < value && { backgroundColor: accent, shadowColor: accent }]}
          />
        ))}
      </View>
    </View>
  );
}

const stat = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  label: { color: '#8888aa', fontSize: 12, width: 32, letterSpacing: 1 },
  track: { flexDirection: 'row', gap: 6 },
  pip: {
    width: 14, height: 14, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4, elevation: 3,
  },
});

export default function CharacterSelectScreen({ navigation }: Props) {
  const { width: W } = useWindowDimensions();
  const { characterId, setCharacterId } = useSettings();

  const initialIndex = CHARACTERS.findIndex(c => c.id === characterId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    if (index !== currentIndex) setCurrentIndex(index);
  }

  function handleConfirm() {
    setCharacterId(CHARACTERS[currentIndex].id);
    navigation.goBack();
  }

  const char = CHARACTERS[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>뒤로가기</Text>
      </TouchableOpacity>
      <Text style={styles.title}>캐릭터 선택</Text>

      {/* 슬라이드 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentOffset={{ x: currentIndex * W, y: 0 }}
        style={{ flexGrow: 0 }}
      >
        {CHARACTERS.map(c => (
          <View key={c.id} style={[styles.slide, { width: W }]}>
            {/* 캐릭터 미리보기 */}
            <View style={[styles.previewArea, { borderColor: c.accent, shadowColor: c.accent }]}>
              <View style={{ width: PREVIEW_W, height: PREVIEW_H, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: CHAR_WIDTH, height: CHAR_HEIGHT, transform: [{ scale: PREVIEW_SCALE }] }}>
                  <Character
                    x={CHAR_WIDTH / 2}
                    bottom={0}
                    isListening={c.id === CHARACTERS[currentIndex].id}
                    theme={c}
                  />
                </View>
              </View>
            </View>

            {/* 이름 */}
            <Text style={[styles.charName, { color: c.accent }]}>{c.name}</Text>
            <Text style={[styles.charTitle, { color: c.headColor }]}>{c.title}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 페이지 인디케이터 */}
      <View style={styles.dots}>
        {CHARACTERS.map((c, i) => (
          <View
            key={c.id}
            style={[styles.dot, i === currentIndex && { backgroundColor: char.accent, shadowColor: char.accent }]}
          />
        ))}
      </View>

      {/* 설명 및 스탯 (슬라이드 밖 — 현재 캐릭터 정보) */}
      <View style={[styles.infoCard, { borderColor: char.accent + '44' }]}>
        <Text style={styles.desc}>{char.description}</Text>
        <View style={styles.statWrap}>
          {char.stats.map(s => (
            <StatBar key={s.label} label={s.label} value={s.value} accent={char.accent} />
          ))}
        </View>
      </View>

      {/* 확인 버튼 */}
      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: char.bodyColor, borderColor: char.accent }]}
        onPress={handleConfirm}
      >
        <Text style={[styles.confirmText, { color: char.accent }]}>선택</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 3,
    marginTop: 24, marginBottom: 20,
    textShadowColor: '#4488ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  slide: {
    alignItems: 'center',
    paddingTop: 8,
  },
  previewArea: {
    width: PREVIEW_W + 40,
    height: PREVIEW_H + 40,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  charName: {
    fontSize: 28, fontWeight: '900', letterSpacing: 4, marginTop: 16,
  },
  charTitle: {
    fontSize: 13, fontWeight: '600', letterSpacing: 2, marginTop: 4, opacity: 0.8,
  },
  dots: {
    flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4,
  },
  infoCard: {
    marginHorizontal: 24, marginTop: 12,
    padding: 20, borderRadius: 16, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'stretch',
  },
  desc: {
    color: '#aaaacc', fontSize: 13, lineHeight: 20,
    textAlign: 'center', marginBottom: 16,
  },
  statWrap: { gap: 2 },
  confirmBtn: {
    marginTop: 20, marginBottom: 8,
    paddingHorizontal: 56, paddingVertical: 14,
    borderRadius: 28, borderWidth: 1.5,
  },
  confirmText: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  backBtn: {
    position: 'absolute', top: 12, left: 16, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#6666aa',
    backgroundColor: 'rgba(40,40,80,0.7)',
  },
  backTxt: { color: '#6666aa', fontSize: 18 },
});
