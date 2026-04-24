import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, SafeAreaView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { getStageInfo, STAGE_COUNT } from '../data/words';
import { showInterstitial } from '../utils/admob';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StageClear'>;
  route: RouteProp<RootStackParamList, 'StageClear'>;
};

export default function StageClearScreen({ navigation, route }: Props) {
  const { stage, score } = route.params;
  const info = getStageInfo(stage);
  const isLastStage = stage >= STAGE_COUNT;

  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    showInterstitial();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.bigEmoji}>{info.emoji}</Text>
        <Text style={styles.clearLabel}>STAGE {stage} CLEAR!</Text>
        <Text style={styles.stageName}>{info.label}</Text>
        <Text style={styles.scoreLbl}>획득 점수</Text>
        <Text style={styles.scoreVal}>{score}</Text>
        {isLastStage && (
          <Text style={styles.allClear}>🏆 전체 스테이지 클리어!</Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.btns, { opacity: fade }]}>
        {!isLastStage && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => navigation.replace('Game', { stage: stage + 1 })}
          >
            <Text style={styles.nextTxt}>다음 스테이지 →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => navigation.navigate('StageSelect')}
        >
          <Text style={styles.selectTxt}>스테이지 선택</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a2e',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: 'rgba(20,20,60,0.9)', borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,100,255,0.3)',
    width: '100%',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
  },
  bigEmoji: { fontSize: 72, marginBottom: 8 },
  clearLabel: {
    color: '#ffdd44', fontSize: 22, fontWeight: '900', letterSpacing: 3,
    textShadowColor: '#ffdd44', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  stageName: { color: '#aaaaff', fontSize: 18, marginTop: 4, marginBottom: 20 },
  scoreLbl: { color: '#6666aa', fontSize: 13, letterSpacing: 1 },
  scoreVal: {
    color: '#fff', fontSize: 48, fontWeight: '900',
    textShadowColor: '#4466ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  allClear: {
    color: '#ffdd44', fontSize: 16, fontWeight: 'bold',
    marginTop: 16, letterSpacing: 1,
  },
  btns: { marginTop: 32, gap: 12, width: '100%' },
  nextBtn: {
    backgroundColor: '#ffdd44', paddingVertical: 16, borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#ffdd44', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  nextTxt: { color: '#0a0a2e', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  selectBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 16,
    borderRadius: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  selectTxt: { color: '#aaaacc', fontSize: 16 },
});
