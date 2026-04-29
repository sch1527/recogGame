import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
  route: RouteProp<RootStackParamList, 'GameOver'>;
};



export default function GameOverScreen({ navigation, route }: Props) {
  const { score, stage } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.scoreLbl}>최종 점수</Text>
        <Text style={styles.scoreVal}>{score}</Text>
      </Animated.View>

      <Animated.View style={[styles.btns, { opacity: fade }]}>
        <TouchableOpacity style={styles.retry} onPress={() => navigation.replace('Game', { stage })}>
          <Text style={styles.retryTxt}>다시 도전</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.home} onPress={() => navigation.navigate('StageSelect')}>
          <Text style={styles.homeTxt}>스테이지 선택</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(20,20,60,0.9)', borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,100,255,0.3)', width: '100%',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  scoreLbl: { color: '#6666aa', fontSize: 24 },
  scoreVal: {
    color: '#ffdd44', fontSize: 52, fontWeight: '900',
    textShadowColor: '#ffdd44', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  btns: { marginTop: 32, gap: 12, width: '100%' },
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
});
