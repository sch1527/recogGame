import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
  route: RouteProp<RootStackParamList, 'GameOver'>;
};

function getRank(score: number) {
  if (score >= 500) return { emoji: '🏆', label: '전설' };
  if (score >= 300) return { emoji: '🥇', label: '고수' };
  if (score >= 150) return { emoji: '🥈', label: '중수' };
  if (score >= 50)  return { emoji: '🥉', label: '초보' };
  return { emoji: '😅', label: '입문' };
}

export default function GameOverScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { score } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rank = getRank(score);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  if (isLandscape) {
    return (
      <SafeAreaView style={styles.container}>
        {/* 가로 모드: 카드(왼쪽) + 버튼(오른쪽) */}
        <View style={styles.landBody}>
          <Animated.View style={[styles.cardLand, { transform: [{ scale }] }]}>
            <Text style={styles.rankEmojiLand}>{rank.emoji}</Text>
            <Text style={styles.gameOverLand}>게임 종료</Text>
            <Text style={styles.rankLabelLand}>{rank.label}</Text>
            <Text style={styles.scoreLblLand}>최종 점수</Text>
            <Text style={styles.scoreValLand}>{score}</Text>
          </Animated.View>

          <Animated.View style={[styles.btnsLand, { opacity: fade }]}>
            <TouchableOpacity style={styles.retry} onPress={() => navigation.replace('Game')}>
              <Text style={styles.retryTxt}>다시 도전</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.home} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.homeTxt}>홈으로</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.rankEmoji}>{rank.emoji}</Text>
        <Text style={styles.gameOver}>게임 종료</Text>
        <Text style={styles.rankLabel}>{rank.label}</Text>
        <Text style={styles.scoreLbl}>최종 점수</Text>
        <Text style={styles.scoreVal}>{score}</Text>
      </Animated.View>

      <Animated.View style={[styles.btns, { opacity: fade }]}>
        <TouchableOpacity style={styles.retry} onPress={() => navigation.replace('Game')}>
          <Text style={styles.retryTxt}>다시 도전</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.home} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeTxt}>홈으로</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center', padding: 24 },

  // 세로 모드
  card: {
    backgroundColor: 'rgba(20,20,60,0.9)', borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,100,255,0.3)', width: '100%',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  rankEmoji: { fontSize: 64, marginBottom: 8 },
  gameOver: { color: '#8888bb', fontSize: 16, letterSpacing: 3 },
  rankLabel: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 20 },
  scoreLbl: { color: '#6666aa', fontSize: 13, letterSpacing: 1 },
  scoreVal: {
    color: '#ffdd44', fontSize: 52, fontWeight: '900',
    textShadowColor: '#ffdd44', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  btns: { marginTop: 32, gap: 12, width: '100%' },

  // 공통 버튼
  retry: {
    backgroundColor: '#4466ff', paddingVertical: 16, borderRadius: 24, alignItems: 'center',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  retryTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  home: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 16, borderRadius: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  homeTxt: { color: '#aaaacc', fontSize: 16 },

  // 가로 모드
  landBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, gap: 24, width: '100%',
  },
  cardLand: {
    flex: 1,
    backgroundColor: 'rgba(20,20,60,0.9)', borderRadius: 20, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,100,255,0.3)',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  rankEmojiLand: { fontSize: 44, marginBottom: 4 },
  gameOverLand: { color: '#8888bb', fontSize: 12, letterSpacing: 3 },
  rankLabelLand: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  scoreLblLand: { color: '#6666aa', fontSize: 11, letterSpacing: 1 },
  scoreValLand: {
    color: '#ffdd44', fontSize: 40, fontWeight: '900',
    textShadowColor: '#ffdd44', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  btnsLand: { flex: 1, gap: 12, justifyContent: 'center' },
});
