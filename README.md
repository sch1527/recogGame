# 산성비 - 음성 인식 영어 게임

화면에서 떨어지는 영어 단어를 보고 목소리로 말해서 없애는 게임입니다.  
초등학교 저학년 어린이를 대상으로 설계되었으며, 어눌한 발음도 인식할 수 있도록 퍼지 매칭을 적용했습니다.

## 게임 방법

1. 앱을 실행하면 홈 화면이 나타납니다
2. 스테이지를 선택하고 시작 버튼을 누릅니다
3. 단어들이 위에서 아래로 떨어집니다
4. 단어를 보고 소리 내어 말하면 레이저가 발사되어 단어가 사라집니다
5. 단어가 바닥에 닿으면 목숨(♥)이 1개 줄어듭니다
6. 목숨 3개를 모두 잃으면 게임 오버
7. 난이도에 따라 지정된 수의 단어를 맞추면 스테이지 클리어

## 스테이지 시스템

| 스테이지 | 주제 | 단어 예시 |
|---------|------|---------|
| 1 - 음식 🍕 | 음식 | Apple, Pizza, Cookie... |
| 2 - 동물 🐾 | 동물 | Dog, Lion, Rabbit... |
| 3 - 탈것 🚗 | 탈것 | Car, Train, Rocket... |
| 4 - 색깔 🎨 | 색깔 | Red, Blue, Purple... |

스테이지가 올라갈수록 단어 낙하 속도가 빨라집니다.  
클리어한 스테이지는 잠금 해제되어 다음 스테이지를 선택할 수 있습니다.

## 난이도 설정

설정 모달에서 난이도를 선택할 수 있으며, 선택한 난이도는 앱을 종료해도 유지됩니다.

| 난이도 | 클리어 조건 | 낙하 속도 |
|--------|-----------|---------|
| Easy   | 단어 8개  | 느림    |
| Normal | 단어 12개 | 보통    |
| Hard   | 단어 18개 | 빠름    |

## 음성 인식 매칭 방식

어린이 발음을 고려해 세 가지 방식으로 정답을 판단합니다:

- 퍼지 매칭: 오타 1~2글자 허용 (단어 길이의 20%)
- Soundex: 발음이 비슷하면 정답 처리 (예: "aple" → "apple")
- 접두사 매칭: 단어의 앞 60% 이상 발음하면 정답 (예: "sno" → "snow")

## 기술 스택

- [Expo](https://expo.dev) (React Native)
- [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition) - 음성 인식 (en-US)
- [@react-navigation/native-stack](https://reactnavigation.org) - 화면 전환
- [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) - 애니메이션
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) - 단어 낙하 애니메이션
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) - 설정 영구 저장
- [expo-keep-awake](https://docs.expo.dev/versions/latest/sdk/keep-awake/) - 게임 중 화면 꺼짐 방지

## 프로젝트 구조

```
src/
├── screens/
│   ├── HomeScreen.tsx          # 홈 화면
│   ├── StageSelectScreen.tsx   # 스테이지 선택 화면
│   ├── GameScreen.tsx          # 게임 화면 (음성 인식 + 단어 낙하)
│   ├── StageClearScreen.tsx    # 스테이지 클리어 화면
│   └── GameOverScreen.tsx      # 게임 오버 화면
├── components/
│   ├── FallingWord.tsx         # 낙하하는 단어 컴포넌트
│   ├── Character.tsx           # 레이저 발사 캐릭터
│   ├── LaserBeam.tsx           # 레이저 빔 애니메이션
│   ├── VoicePanel.tsx          # 음성 인식 상태 표시 패널
│   └── SettingsModal.tsx       # 설정 모달 (볼륨 슬라이더, 난이도 선택)
├── context/
│   └── SettingsContext.tsx     # 볼륨·난이도 전역 상태 및 AsyncStorage 저장
├── data/
│   └── words.ts                # 스테이지별 단어 목록
└── utils/
    └── unlocks.ts              # 스테이지 잠금 해제 관리
```

## 실행 방법

```bash
# 패키지 설치
npm install

# Expo 개발 서버 시작
npm start

# Android 실행
npm run android
```

> Android 기기 또는 에뮬레이터에서 마이크 권한을 허용해야 합니다.  
> `expo-speech-recognition`은 Expo Go를 지원하지 않으므로 EAS build 또는 custom dev client가 필요합니다.
