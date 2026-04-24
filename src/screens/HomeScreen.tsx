import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, BackHandler } from 'react-native';
import LottieView from 'lottie-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import SettingsModal from '../components/SettingsModal';
import { showInterstitial } from '../utils/admob';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start();

  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) { setSettingsOpen(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [settingsOpen]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)}>
        <Text style={styles.gearIcon}>⚙</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* <LottieView source={require('../../assets/Welcome.json')} autoPlay loop style={styles.lottie} /> */}
        <Text style={styles.title}>산성비</Text>
        <Text style={styles.subtitle}>음성 인식 게임</Text>

        <View style={styles.info}>
          <Text style={styles.infoText}>🎤 단어가 떨어지기 전에 말하세요</Text>
          <Text style={styles.infoText}>❤️ 라이프 3개</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => showInterstitial(() => navigation.navigate('StageSelect'))}
        >
          <Text style={styles.btnText}>게임 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.charBtn} onPress={() => navigation.navigate('CharacterSelect')}>
          <Text style={styles.charBtnText}>캐릭터 선택</Text>
        </TouchableOpacity>
      </Animated.View>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} showDifficulty />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lottie: { width: 160, height: 160 },
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
  gearBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 8 },
  gearIcon: { fontSize: 24, color: '#6666aa' },
  charBtn: { marginTop: 16, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#4466ff' },
  charBtnText: { color: '#8899ff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
