import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, BackHandler, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import SettingsModal from '../components/SettingsModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) { setSettingsOpen(false); return true; }
      return false; // 설정창 닫혀있으면 기본 동작(앱 종료) 허용
    });
    return () => sub.remove();
  }, [settingsOpen]);

  if (isLandscape) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)}>
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.contentLand, { opacity: fadeIn }]}>
          {/* 왼쪽: 타이틀 */}
          <View style={styles.leftPane}>
            <LottieView source={require('../../assets/Welcome.json')} autoPlay loop style={styles.lottieLand} />
            <Text style={styles.titleLand}>산성비</Text>
            <Text style={styles.subtitleLand}>음성 인식 게임</Text>
          </View>

          {/* 오른쪽: 설명 + 버튼 */}
          <View style={styles.rightPane}>
            <View style={styles.infoLand}>
              <Text style={styles.infoTextLand}>🎤 단어가 떨어지기 전에 말하세요</Text>
              <Text style={styles.infoTextLand}>❤️ 라이프 3개</Text>
              <Text style={styles.infoTextLand}>🎯 10단어마다 스테이지 업</Text>
            </View>
            <TouchableOpacity style={styles.btnLand} onPress={() => navigation.navigate('StageSelect')}>
              <Text style={styles.btnTextLand}>게임 시작</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} showDifficulty />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)}>
        <Text style={styles.gearIcon}>⚙</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <LottieView source={require('../../assets/Welcome.json')} autoPlay loop style={styles.lottie} />
        <Text style={styles.title}>산성비</Text>
        <Text style={styles.subtitle}>음성 인식 게임</Text>

        <View style={styles.info}>
          <Text style={styles.infoText}>🎤 단어가 떨어지기 전에 말하세요</Text>
          <Text style={styles.infoText}>❤️ 라이프 3개</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('StageSelect')}>
          <Text style={styles.btnText}>게임 시작</Text>
        </TouchableOpacity>
      </Animated.View>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} showDifficulty />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },

  // 세로 모드
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lottie: { width: 160, height: 160 },
  lottieLand: { width: 100, height: 100 },
  title: {
    fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: 4,
    textShadowColor: '#4488ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitle: { fontSize: 18, color: '#8888cc', marginTop: 4, marginBottom: 40, letterSpacing: 2 },
  info: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 20, gap: 10, marginBottom: 40, width: '100%',
  },
  infoText: { color: '#aaaadd', fontSize: 16, textAlign: 'center' },
  btn: {
    backgroundColor: '#4466ff', paddingHorizontal: 56, paddingVertical: 18,
    borderRadius: 32, elevation: 8,
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 16,
  },
  btnText: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },

  // 가로 모드
  contentLand: {
    flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 24,
  },
  leftPane: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(100,100,255,0.2)', paddingRight: 24,
  },
  emojiLand: { fontSize: 48, marginBottom: 6 },
  titleLand: {
    fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 4,
    textShadowColor: '#4488ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitleLand: { fontSize: 14, color: '#8888cc', marginTop: 4, letterSpacing: 2 },
  rightPane: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  infoLand: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    padding: 14, gap: 8, width: '100%',
  },
  infoTextLand: { color: '#aaaadd', fontSize: 13, textAlign: 'center' },
  btnLand: {
    backgroundColor: '#4466ff', paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 28, elevation: 8, width: '100%', alignItems: 'center',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 16,
  },
  btnTextLand: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },

  gearBtn: {
    position: 'absolute', top: 12, right: 16, zIndex: 10,
    padding: 8,
  },
  gearIcon: { fontSize: 24, color: '#6666aa' },
});
