import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, BackHandler, ImageBackground, Image, Dimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import SettingsModal from '../components/SettingsModal';
import { initAds } from '../utils/admob';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { width, height } = Dimensions.get('screen');
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => {
      initAds();
    });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) { setSettingsOpen(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [settingsOpen]);

  return (
    <ImageBackground
      source={require('../../assets/images/home_bg.png')}
      style={[styles.bg, { width, height }]}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.chaContainer, { opacity: fadeIn }]}>
          <Image source={require('../../assets/images/cha.png')} style={styles.chaImg} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CharacterSelect')}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('../../assets/images/btn.png')}
                style={styles.btnImg}
                resizeMode="stretch"
              >
                <Text style={styles.btnText}>START</Text>
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} activeOpacity={0.8}>
              <ImageBackground
                source={require('../../assets/images/btn.png')}
                style={styles.btnImg}
                resizeMode="stretch"
              >
                <Text style={styles.btnText}>OPTION</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.copyright}>Copyright © 2026 Amanta. All Rights Reserved.</Text>

        <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} showDifficulty />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0a0a2e' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  title: {
    fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: 4,
    textShadowColor: '#4488ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitle: { fontSize: 18, color: '#8888cc', marginTop: 4, marginBottom: 40, letterSpacing: 2 },
  chaContainer: {
    position: 'absolute', top: 50, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  chaImg: { width: '110%', height: '80%' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnImg: { width: 150, height: 58, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'pre-black', letterSpacing: 2 },
  copyright: { color: '#fff', fontFamily: 'pre-b', fontSize: 9, textAlign: 'center', paddingBottom: 16 },
});
