import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, BackHandler, Modal, ScrollView,
} from 'react-native';
import { playWordSound, stopWordSound } from '../utils/wordSound';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { STAGES, STAGE_COUNT, StageInfo } from '../data/words';
import { getUnlockedStages } from '../utils/unlocks';
import { useFocusEffect } from '@react-navigation/native';
import SettingsModal from '../components/SettingsModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'StageSelect'> };

type PreviewState = { stageNum: number; info: StageInfo } | null;

export default function StageSelectScreen({ navigation }: Props) {
  const [unlocked, setUnlocked] = useState<number[]>([1]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getUnlockedStages().then(setUnlocked);
    }, [])
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) { setSettingsOpen(false); return true; }
      if (preview) { setPreview(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [settingsOpen, preview]);

  const allCleared = unlocked.length >= STAGE_COUNT;

  const speakWord = (word: string) => {
    setPlayingWord(word);
    playWordSound(word).finally(() => setPlayingWord(null));
  };

  const closePreview = () => {
    stopWordSound();
    setPlayingWord(null);
    setPreview(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)}>
        <Text style={styles.gearIcon}>⚙</Text>
      </TouchableOpacity>

      <Text style={styles.title}>스테이지 선택</Text>
      {allCleared && (
        <Text style={styles.allClear}>🏆 전체 클리어!</Text>
      )}

      <View style={styles.grid}>
        {Object.entries(STAGES).map(([key, info]) => {
          const stageNum = Number(key);
          const isUnlocked = unlocked.includes(stageNum);
          return (
            <TouchableOpacity
              key={stageNum}
              style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}
              activeOpacity={isUnlocked ? 0.7 : 1}
              onPress={() => {
                if (isUnlocked) setPreview({ stageNum, info });
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

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>뒤로가기</Text>
      </TouchableOpacity>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} showDifficulty />

      {/* 단어 미리보기 모달 */}
      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {preview && (
              <>
                <Text style={styles.modalEmoji}>{preview.info.emoji}</Text>
                <Text style={styles.modalTitle}>
                  STAGE {preview.stageNum} · {preview.info.label}
                </Text>
                <Text style={styles.modalHint}>단어를 눌러 발음을 들어보세요 🔊</Text>

                <ScrollView
                  contentContainerStyle={styles.wordGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {preview.info.words.map((word) => (
                    <TouchableOpacity
                      key={word}
                      style={[
                        styles.wordBtn,
                        playingWord === word && styles.wordBtnActive,
                      ]}
                      onPress={() => speakWord(word)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.wordBtnIcon}>
                        {playingWord === word ? '🔊' : '🔈'}
                      </Text>
                      <Text style={[
                        styles.wordText,
                        playingWord === word && styles.wordTextActive,
                      ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closePreview}>
                    <Text style={styles.cancelTxt}>닫기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => {
                      closePreview();
                      navigation.navigate('Game', { stage: preview.stageNum });
                    }}
                  >
                    <Text style={styles.startTxt}>게임 시작 ▶</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a2e',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  gearBtn: {
    position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 8,
  },
  gearIcon: { fontSize: 24, color: '#6666aa' },
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
  backBtn: {
    position: 'absolute', top: 12, left: 16, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#6666aa',
    backgroundColor: 'rgba(40,40,80,0.7)',
  },
  backTxt: { color: '#6666aa', fontSize: 18 },

  // 모달
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#12123a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(100,120,255,0.4)',
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 44, marginBottom: 6 },
  modalTitle: {
    color: '#fff', fontSize: 20, fontWeight: '900',
    letterSpacing: 2, marginBottom: 4,
  },
  modalHint: {
    color: '#8888cc', fontSize: 13, marginBottom: 16,
  },
  wordGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 10,
    paddingBottom: 4,
  },
  wordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(40,40,100,0.8)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(80,100,200,0.4)',
  },
  wordBtnActive: {
    backgroundColor: 'rgba(60,80,200,0.9)',
    borderColor: '#6688ff',
  },
  wordBtnIcon: { fontSize: 16 },
  wordText: {
    color: '#ccd', fontSize: 17, fontWeight: '600',
  },
  wordTextActive: {
    color: '#fff',
  },
  modalBtns: {
    flexDirection: 'row', gap: 12, marginTop: 20,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(80,80,120,0.5)',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(100,100,160,0.4)',
  },
  cancelTxt: { color: '#aaa', fontSize: 15, fontWeight: '700' },
  startBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#3344cc',
    alignItems: 'center',
    shadowColor: '#4466ff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
  startTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
