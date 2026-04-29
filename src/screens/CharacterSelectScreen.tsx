import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { CHARACTERS } from '../data/characters';
import { useSettings } from '../context/SettingsContext';
import Character, { CHAR_WIDTH, CHAR_HEIGHT } from '../components/Character';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CharacterSelect'> };

const MAX_PREVIEW_SCALE = 3.5;

const STAT_COLORS: Record<string, string> = {
  '파워': '#FFDE00',
  '속도': '#99E048',
  '콤보': '#50DAE3',
};

function StatBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={stat.row}>
      <Text style={stat.label}>{label}</Text>
      <View style={stat.track}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[stat.pip, i < value && { backgroundColor: accent }]}
          />
        ))}
      </View>
    </View>
  );
}

const stat = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  label: { color: '#fff', fontSize: 10,fontFamily: 'pre-sb' },
  track: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pip: {
    width: 10, height: 16, borderRadius: 5,
    backgroundColor: '#514A92',
    // shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4, elevation: 3,
  },
});

export default function CharacterSelectScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const boxW = Math.min(W * 0.65, 380);
  const boxH = Math.min(H * 0.40, 320);
  const PREVIEW_SCALE = Math.min(W / 140, MAX_PREVIEW_SCALE);
  const PREVIEW_W = CHAR_WIDTH * PREVIEW_SCALE;
  const PREVIEW_H = CHAR_HEIGHT * PREVIEW_SCALE;
  const { characterId, setCharacterId } = useSettings();

  const initialIndex = CHARACTERS.findIndex(c => c.id === characterId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    if (index !== currentIndex) setCurrentIndex(index);
  }

  function navigateTo(index: number) {
    const clamped = Math.max(0, Math.min(CHARACTERS.length - 1, index));
    scrollRef.current?.scrollTo({ x: clamped * W, animated: true });
    setCurrentIndex(clamped);
  }

  function handleConfirm() {
    setCharacterId(CHARACTERS[currentIndex].id);
    navigation.navigate('StageSelect');
  }

  return (
    <ImageBackground
      source={require('../../assets/images/cha_select_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* 상단 헤더 행 */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backTxt}>뒤로가기</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.2)']}
            start={{x:0, y:0}}
            end={{x:1, y: 0}}
            locations={[0, 0.5, 1]}
            style={styles.titleGradient}
          >
            <Text style={styles.title}>Select Hero</Text>
          </LinearGradient>
        </View>

        {/* 슬라이드 + 좌우 버튼 */}
        <View style={styles.slideContainer}>
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
                {/* 캐릭터 정보 */}
                <View style={[styles.chaBox, { width: boxW, height: boxH }]}>
                  <View style={{alignItems:'center'}}>
                    <Text style={[styles.charTitle, { color: c.headColor }]}>{c.title}</Text>
                  </View>
                  {/* 이름 */}
                  <View style={[styles.nameWrap]}>
                    <Text style={styles.txt}>이름:</Text>
                    <Text style={styles.txt}>{c.name}</Text>
                  </View>
                  {/* 특징 */}
                  <View style={[styles.descWrap]}>
                    <Text style={styles.txt}>특징:</Text>
                    <Text style={[styles.txt, styles.desc]}>{c.description}</Text>
                  </View>
                  {/* 캐릭터 스탯 */}
                  <View style={styles.statWrap}>
                    {c.stats.map(s => (
                      <StatBar key={s.label} label={s.label} value={s.value} accent={STAT_COLORS[s.label] ?? c.headColor} />
                    ))}
                  </View>                       
                </View>

                {/* 캐릭터 미리보기 */}
                <View style={[styles.previewArea, { borderColor: c.headColor, shadowColor: c.headColor, width: PREVIEW_W + 40, height: PREVIEW_H + 40 }]}>
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
            ))}
          </ScrollView>

          {/* 왼쪽 버튼 */}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnLeft]}
            onPress={() => navigateTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <Image
              source={currentIndex === 0
                ? require('../../assets/images/btn_prev_next_0001.png')
                : require('../../assets/images/btn_prev_next_0002.png')}
              style={styles.navBtnImg}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* 오른쪽 버튼 */}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnRight]}
            onPress={() => navigateTo(currentIndex + 1)}
            disabled={currentIndex === CHARACTERS.length - 1}
          >
            <Image
              source={currentIndex === CHARACTERS.length - 1
                ? require('../../assets/images/btn_prev_next_0001.png')
                : require('../../assets/images/btn_prev_next_0002.png')}
              style={[styles.navBtnImg, { transform: [{ scaleX: -1 }] }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
          <ImageBackground
            source={require('../../assets/images/btn.png')}
            style={styles.confirmBtn}
            resizeMode="stretch"
          >
            <Text style={styles.confirmText}>SELECT</Text>
          </ImageBackground>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center' },
  topRow: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  slideContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  titleGradient: {
    paddingHorizontal: 50,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 25, fontWeight: '900', color: '#fff', letterSpacing: 3,
    textShadowColor: '#4488ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
    paddingVertical: 10,
    fontFamily: 'pre-b',
  },
  slide: {
    alignItems: 'center',
    paddingTop: 8,
  },
  previewArea: {
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
    marginTop: 16,
  },
  chaBox: {
    borderColor: '#069CE9', borderRadius: 20, borderWidth: 4,
  },
  txt: { color: '#ffffff', fontFamily: 'pre-sb', fontSize: 10 },
  nameWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  charTitle: {
    fontSize: 25, fontFamily: 'pre-black', letterSpacing: 2, marginTop: 20,
    textShadowColor: '#FF3399', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
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
  descWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 32,
  },
  desc: {
    flex: 1,
    textAlign: 'justify',
  },
  statWrap: { gap: 2 },
  confirmBtn: {
    width: 150, height: 58,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16, marginBottom: 24,
  },
  confirmText: { color: '#fff', fontSize: 15, fontFamily: 'pre-black', letterSpacing: 2 },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#6666aa',
    backgroundColor: 'rgba(40,40,80,0.7)',
    alignSelf: 'flex-start',
  },
  backTxt: { color: '#6666aa', fontSize: 18 },
  navBtn: { position: 'absolute', top: '40%' },
  navBtnLeft: { left: 0 },
  navBtnRight: { right: 0 },
  navBtnImg: { width: 48, height: 64 },
});
