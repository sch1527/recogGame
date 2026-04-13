import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, useWindowDimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { STAGES, STAGE_COUNT } from '../data/words';
import { getUnlockedStages } from '../utils/unlocks';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'StageSelect'> };

export default function StageSelectScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [unlocked, setUnlocked] = useState<number[]>([1]);

  useFocusEffect(
    useCallback(() => {
      getUnlockedStages().then(setUnlocked);
    }, [])
  );

  const allCleared = unlocked.length >= STAGE_COUNT;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>스테이지 선택</Text>
      {allCleared && (
        <Text style={styles.allClear}>🏆 전체 클리어!</Text>
      )}

      <View style={[styles.grid, isLandscape && styles.gridLand]}>
        {Object.entries(STAGES).map(([key, info]) => {
          const stageNum = Number(key);
          const isUnlocked = unlocked.includes(stageNum);
          return (
            <TouchableOpacity
              key={stageNum}
              style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}
              activeOpacity={isUnlocked ? 0.7 : 1}
              onPress={() => {
                if (isUnlocked) navigation.navigate('Game', { stage: stageNum });
              }}
            >
              {isUnlocked ? (
                <>
                  <Text style={styles.emoji}>{info.emoji}</Text>
                  <Text style={styles.stageNum}>STAGE {stageNum}</Text>
                  <Text style={styles.label}>{info.label}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.stageNumLocked}>STAGE {stageNum}</Text>
                  <Text style={styles.labelLocked}>{stageNum - 1}스테이지 클리어 필요</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backTxt}>← 홈으로</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a2e',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  title: {
    color: '#fff', fontSize: 28, fontWeight: '900',
    letterSpacing: 3, marginBottom: 8,
  },
  allClear: {
    color: '#ffdd44', fontSize: 16, fontWeight: 'bold',
    marginBottom: 16, letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 16, marginVertical: 24,
  },
  gridLand: { gap: 12 },
  card: {
    width: 140, height: 140, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5,
  },
  cardUnlocked: {
    backgroundColor: 'rgba(40,40,100,0.9)',
    borderColor: 'rgba(100,120,255,0.6)',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  cardLocked: {
    backgroundColor: 'rgba(20,20,40,0.6)',
    borderColor: 'rgba(80,80,100,0.3)',
  },
  emoji: { fontSize: 40 },
  lockIcon: { fontSize: 36, opacity: 0.5 },
  stageNum: { color: '#8888cc', fontSize: 11, letterSpacing: 2 },
  stageNumLocked: { color: '#444466', fontSize: 11, letterSpacing: 2 },
  label: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  labelLocked: { color: '#444466', fontSize: 11, textAlign: 'center', paddingHorizontal: 8 },
  backBtn: { marginTop: 8 },
  backTxt: { color: '#6666aa', fontSize: 15 },
});
